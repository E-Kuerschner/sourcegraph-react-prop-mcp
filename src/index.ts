import "dotenv/config";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { testConnection, executeSrcCommand } from "./sourcegraph.js";
import { formatSearchResults, formatVersionInfo } from "./formatters.js";

// Create an MCP server
const server = new McpServer({
  name: "Sourcegraph MCP Server",
  version: "0.1.0",
});

server.resource(
  "echo",
  new ResourceTemplate("echo://{message}", { list: undefined }),
  async (uri, { message }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Resource echo: ${message}`,
      },
    ],
  }),
);

// Add a simple hello world tool
server.tool(
  "hello",
  "A simple greeting tool",
  { name: z.string().optional() },
  async ({ name = "World" }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  }),
);

// Add a tool to test the Sourcegraph connection
server.tool(
  "testSourcegraphConnection",
  "Test the connection to Sourcegraph and return version info",
  async () => {
    try {
      const versionInfo = await testConnection();
      return {
        content: [
          {
            type: "text",
            text: formatVersionInfo(versionInfo),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error connecting to Sourcegraph: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Add a tool to execute a Sourcegraph search
server.tool(
  "search",
  "Search code in Sourcegraph",
  {
    query: z.string().describe("The search query to execute"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of results to return"),
  },
  async ({ query, limit = 10 }) => {
    try {
      const searchResults = await executeSrcCommand("search", [
        query,
        "-n",
        String(limit),
        "--json",
      ]);
      return {
        content: [
          {
            type: "text",
            text: formatSearchResults(searchResults),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing search: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Add a tool to get specific file content
server.tool(
  "getFileContent",
  "Get the contents of a specific file from Sourcegraph",
  {
    repository: z
      .string()
      .describe("Repository name (e.g., github.com/user/repo)"),
    path: z.string().describe("File path within the repository"),
    revision: z
      .string()
      .optional()
      .describe("Git revision (branch, tag, or commit hash)"),
  },
  async ({ repository, path, revision = "HEAD" }) => {
    try {
      // Construct the query to get file content
      const query = `repo:^${repository}$ file:^${path}$ rev:${revision}`;
      const fileContent = await executeSrcCommand("search", [
        query,
        "-n",
        "1",
        "--json",
      ]);

      // Format the results
      const formattedContent = formatSearchResults(fileContent);
      return {
        content: [
          {
            type: "text",
            text: formattedContent || "File not found or empty.",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving file content: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Start the server using the stdio transport
const start = async () => {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log environment variables for debugging (without the token)
    console.error(
      `SRC_ENDPOINT: ${process.env.SRC_ENDPOINT || "Not set, using default"}`,
    );
    console.error(
      `SRC_ACCESS_TOKEN: ${process.env.SRC_ACCESS_TOKEN ? "Set" : "Not set"}`,
    );
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

start();
