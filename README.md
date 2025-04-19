# Sourcegraph MCP Server

An MCP (Model Context Protocol) server that integrates with Sourcegraph to provide code search and analysis capabilities to LLMs.

### Sourcegraph Access Token
You will need to generate an API access token before using any of the server's tools.

1. Visit your Sourcegraph instance (e.g., https://sourcegraph.com)
2. Click your profile icon in the top right
3. Navigate to **Settings > Access tokens**
4. Create a new token with appropriate scopes
5. Copy the token and set it as an environment variable

### Environment Variables
The server uses two environment variables which can be set on your local environment or in the MCP server configuration.

- `SRC_ACCESS_TOKEN`: Your Sourcegraph access token (see above)
- `SRC_ENDPOINT` (optional): Your Sourcegraph instance URL (defaults to https://sourcegraph.com)

## Installation

### 1. Build the server from Typescript

```bash
yarn run build
```

### 2. Configure MCP Server

There are many MCP Clients available to use, but below are two examples:

- [Cursor configuration](https://docs.cursor.com/context/model-context-protocol#configuring-mcp-servers)
- [Claude Desktop configuration](https://modelcontextprotocol.io/quickstart/user#2-add-the-filesystem-mcp-server)

#### Install script

For convenience, there is an optional install script which you can run to automatically set up Cursor with the correct configuration.
The script will walk you through setting up your Sourcegraph environment variables, so have your access token ready before starting.

```bash
./install_cursor.sh
```

### 3. Verify Installation

When you have completed the setup steps, confirm that the server is correctly configured with your MCP Client by prompting it to use the `testSourcegraphConnection` tool.

## Available Tools

The server exposes the following tools to an LLM:

1. `testSourcegraphConnection`: Test the connection to Sourcegraph and return version information
2. `search`: Search code in Sourcegraph with a given query and limiting results
3. `getFileContent`: Retrieve specific file contents from a repository
4. `searchReactPropUsage`: Searches Sourcegraph for code that uses a specific prop of a specific React component