#!/bin/bash

# Sourcegraph MCP Server Installation Script

# Step 1: Clone the repository (placeholder for now)
echo "TODO: Clone the repository"

# Step 2: Install dependencies and build the server
echo "Installing dependencies with yarn..."
yarn install
echo "Building the server with yarn build..."
yarn build

# Step 3: Ask for SRC_ACCESS_TOKEN and write to .env
echo "Please enter your Sourcegraph Access Token (SRC_ACCESS_TOKEN):"
read -r token

# Create or update .env file with the token
echo "SRC_ACCESS_TOKEN=\"$token\"" > .env
echo "Token written to .env file."

# Step 4: Check if Cursor config file exists and add MCP configuration
# Get the absolute path to the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if .cursor folder exists in the current working directory
if [ -d "$SCRIPT_DIR/.cursor" ]; then
    CONFIG_FILE="$SCRIPT_DIR/.cursor/mcp.json"
    # Create mcp.json if it doesn't exist
    if [ ! -f "$CONFIG_FILE" ]; then
        mkdir -p "$SCRIPT_DIR/.cursor"
        echo "{}" > "$CONFIG_FILE"
    fi
else
    # Fall back to using the path in $HOME
    CONFIG_FILE="$HOME/.cursor/mcp.json"
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "Error: Cursor config file not found at $CONFIG_FILE"
        echo "Please make sure Cursor is installed."
        exit 1
    fi
fi

# Add MCP configuration to Cursor config file
# We need to use a temporary file for the transformation
TMP_FILE=$(mktemp)

# Check if jq is installed
if command -v jq &> /dev/null; then
    # Use jq to update the JSON file
    jq --arg path "$SCRIPT_DIR" '.mcp = {"enabled": true, "command": "yarn --cwd \($path) start"}' "$CONFIG_FILE" > "$TMP_FILE"
    mv "$TMP_FILE" "$CONFIG_FILE"
else
    # Fallback if jq is not available
    echo "Warning: jq is not installed. Manual configuration is required."
    echo "Please add the following configuration to your Cursor config file at $CONFIG_FILE:"
    echo ""
    echo "\"mcp\": {"
    echo "  \"enabled\": true,"
    echo "  \"command\": \"yarn --cwd $SCRIPT_DIR start\""
    echo "}"
    exit 1
fi

echo "Installation complete! MCP configuration has been added to Cursor."
echo "You can now use Sourcegraph MCP with Cursor."
