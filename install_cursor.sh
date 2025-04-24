#!/bin/bash

# Sourcegraph MCP Server Installation Script

# Step 1: Check if Cursor is installed correctly
echo "Installing sourcegraph-mcp server to $HOME/.cursor..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/.cursor"
CONFIG_FILE="$CONFIG_DIR/mcp.json"

# Check if the .cursor folder exists in the HOME directory
if [ ! -d "$CONFIG_DIR" ]; then
    echo "Error: The .cursor folder does not exist in your HOME directory ($CONFIG_DIR)."
    echo "Cursor may not be installed correctly. Please install Cursor and try again."
    exit 1
fi

# Create mcp.json if it doesn't exist
if [ ! -f "$CONFIG_FILE" ] || [ ! -s "$CONFIG_FILE" ]; then
    echo "{}" > "$CONFIG_FILE"
fi

# Step 2: Install dependencies and build the server
echo "Installing dependencies with yarn . . ."
yarn install
echo "Compiling TypeScript source code . . ."
yarn build

# Step 3: Set up server runtime env vars
echo "Enter Sourcegraph URL (https://sourcegraph.com):"
read -r sourcegraph_url
sourcegraph_url=${sourcegraph_url:-"https://sourcegraph.com"}
echo "Enter your Sourcegraph Access Token:"
read -r token

# Add MCP configuration to Cursor config file
# We need to use a temporary file for the transformation
TMP_FILE=$(mktemp)

# Check if jq is installed
if command -v jq &> /dev/null; then
    # Use jq to update the JSON file with the new mcpServers format
    jq --arg server_file "$SCRIPT_DIR/dist/index.js" --arg token "$token" --arg sourcegraph_url "$sourcegraph_url" '.mcpServers = {
        "sourcegraph-mcp": {
            "command": "node",
            "args": [$server_file],
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
    echo "    \"command\": \"node\","
    echo "    \"args\": [\"$SCRIPT_DIR/dist/index.js\"],"
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
