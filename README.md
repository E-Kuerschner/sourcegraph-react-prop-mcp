# Sourcegraph MCP Server

An MCP (Model Context Protocol) server that integrates with Sourcegraph to provide code search and analysis capabilities to LLMs.

## Prerequisites

- Node.js 18 or later
- Sourcegraph src-cli installed and in your PATH
- A Sourcegraph access token

## Installation

### Install src-cli

Before using this server, you need to install Sourcegraph's src-cli tool:

- **macOS**:
  ```bash
  brew install sourcegraph/src-cli/src-cli
  ```

- **Linux**:
  ```bash
  curl -L https://sourcegraph.com/.api/src-cli/src_linux_amd64 -o /usr/local/bin/src
  chmod +x /usr/local/bin/src
  ```

- **Windows**: See [Sourcegraph CLI for Windows](https://github.com/sourcegraph/src-cli/blob/main/WINDOWS.md)

### Install the MCP Server

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Build the TypeScript code:

```bash
npm run build
```

## Configuration

### Sourcegraph Access Token

1. Visit your Sourcegraph instance (e.g., https://sourcegraph.com)
2. Click your profile icon in the top right
3. Navigate to **Settings > Access tokens**
4. Create a new token with appropriate scopes
5. Copy the token and set it as an environment variable

### Environment Variables

Set the following environment variables:

- `SRC_ACCESS_TOKEN`: Your Sourcegraph access token
- `SRC_ENDPOINT` (optional): Your Sourcegraph instance URL (defaults to https://sourcegraph.com)

## Running the Server

```bash
npm start
```

Or with environment variables:

```bash
SRC_ACCESS_TOKEN=your_token SRC_ENDPOINT=https://sourcegraph.example.com npm start
```

## Connecting with Claude Desktop

To configure Claude Desktop to use this MCP server:

1. Open Claude Desktop
2. Click on your profile icon in the bottom-left corner
3. Select "Settings"
4. Choose "Advanced" from the sidebar
5. Under "Model Context Protocol (MCP) Configuration":
    - Enable "Use a custom MCP server"
    - For "Command to start MCP server", enter the full path to your npm executable followed by `start` in the project directory. For example:
      ```
      /usr/local/bin/npm --prefix /path/to/sourcegraph-mcp-server start
      ```
      Or with environment variables:
      ```
      SRC_ACCESS_TOKEN=your_token SRC_ENDPOINT=https://sourcegraph.example.com /usr/local/bin/npm --prefix /path/to/sourcegraph-mcp-server start
      ```
6. Click "Save"
7. Restart Claude Desktop for the changes to take effect

### Testing the Connection

Once configured, you can test the connection by asking Claude something like:

- "Can you test if the Sourcegraph connection is working?"
- "Search for implementations of quicksort in Go"
- "Find React hooks in the Facebook React repository"

Claude should invoke the appropriate tools from your MCP server to respond to these requests.

## Available Tools

The server exposes the following tools to an LLM:

1. `hello`: A simple greeting tool to test if the server is working
2. `testSourcegraphConnection`: Test the connection to Sourcegraph and return version information
3. `search`: Search code in Sourcegraph with a given query and limiting results
4. `getFileContent`: Retrieve specific file contents from a repository

## Using with Other MCP-compatible LLMs

This server implements the MCP protocol over stdio, so it can be used with any MCP-compatible client. For example, with the MCP Inspector:

```bash
mcp-inspector stdio -- npm start
```

## Development

For development, you can use:

```bash
npm run dev
```

This will build and run the server in one command.

## Example Queries

See [EXAMPLES.md](EXAMPLES.md) for example queries and expected tool invocations.