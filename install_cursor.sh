#!/bin/bash

# Sourcegraph MCP Server Installation Script

# Step 1: Confirm installation location
echo "Installing sourcegraph-mcp server..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/.cursor/mcp.json"

echo "Confirm installation location: $SCRIPT_DIR/.cursor (y/n)"
read -r confirm
if [[ "$confirm" =~ ^[Nn]$ ]]; then
    echo "sourcegraph-mcp may only be installed to a project's local .cursor folder at the root of your repository"
    exit 1
fi

# Create .cursor/mcp.json if it doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
    mkdir -p "$SCRIPT_DIR/.cursor"
    echo "{}" > "$CONFIG_FILE"
fi

# Step 2: Install dependencies and build the server
echo "Installing dependencies with yarn..."
yarn install
echo "Building the server with yarn build..."
yarn build

# Step 3: Set up server runtime env vars
echo "Enter the Sourcegraph URL (https://sourcegraph.com):"
read -r sourcegraph_url
sourcegraph_url=${sourcegraph_url:-"https://sourcegraph.com"}
echo $sourcegraph_url
echo "Enter your Sourcegraph Access Token:"
read -r token

# Add MCP configuration to Cursor config file
# We need to use a temporary file for the transformation
TMP_FILE=$(mktemp)

# Check if jq is installed
if command -v jq &> /dev/null; then
    # Use jq to update the JSON file with the new mcpServers format
    jq --arg path "$SCRIPT_DIR" --arg token "$token" --arg sourcegraph_url "$sourcegraph_url" '.mcpServers = {
        "sourcegraph-mcp": {
            "command": "yarn",
            "args": ["--cwd", $path, "start"],
            "env": {
                "SRC_ACCESS_TOKEN": ($token),
                "SRC_ENDPOINT": ($sourcegraph_url)
            }
        }
    }' "$CONFIG_FILE" > "$TMP_FILE"
    mv "$TMP_FILE" "$CONFIG_FILE"
else
    # Fallback if jq is not available
    echo "Please add the following configuration to your Cursor config file at $CONFIG_FILE:"
    echo ""
    echo "\"mcpServers\": {"
    echo "  \"sourcegraph-mcp\": {"
    echo "    \"command\": \"yarn\","
    echo "    \"args\": [\"--cwd\", \"$SCRIPT_DIR\", \"start\"],"
    echo "    \"env\": {"
    echo "      \"SRC_ACCESS_TOKEN\": \"<your-token-here>\""
    echo "      \"SRC_ENDPOINT\": \"<sourcegraph-url-here>\""
    echo "    }"
    echo "  }"
    echo "}"
    exit 1
fi

echo "Installation complete! MCP configuration has been added to Cursor."
echo "You can now use sourcegraph-mcp with Cursor in Agent mode."
