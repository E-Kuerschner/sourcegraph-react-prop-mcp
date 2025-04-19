import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { testConnection, executeSrcCommand } from "./sourcegraph.js";
import {
  formatSearchResults,
  formatFileLookupResults,
  formatVersionInfo,
} from "./formatters.js";

// Create an MCP server
const server = new McpServer({
  name: "Sourcegraph (React prop usage) MCP Server",
  version: "0.1.0",
});

////////// TOOLS ////////////////////
enum ToolType {
  testSourcegraphConnection = "testSourcegraphConnection",
  generalSearch = "generalSearch",
  getFileContent = "getFileContent",
  searchReactPropUsage = "searchReactPropUsage",
}

// Add a tool to test the Sourcegraph connection
server.tool(
  ToolType.testSourcegraphConnection,
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

//Add a tool to execute a Sourcegraph search
server.tool(
  ToolType.generalSearch,
  `
    Search for code in Sourcegraph. Use this tool for general searches.
    Do not prioritize it over more specific search tools.
    Do not use this tool for retrieving the full source code of a specific file.
    Always present the information by highlighting the repository, file name and a snippet of the matching code.
  `,
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
    const queryWithOptions = `${query} count:${limit}`;
    try {
      const searchResults = await executeSrcCommand("search", [
        "-json",
        queryWithOptions,
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
  ToolType.getFileContent,
  `
    Returns the contents of a specific file in GitHub via the Sourcegraph API.
    Useful for gathering more context on a particular file or for when the user requests the source code of a specific file.
    If the file is not found, do not attempt to retrieve the file by another method.
  `,
  {
    repository: z
      .string()
      .describe("Repository name (e.g., github.com/user/repo)"),
    path: z
      .string()
      .describe("File name or path to a file within the repository"),
    revision: z
      .string()
      .optional()
      .describe("Git revision (branch, tag, or commit hash)"),
  },
  async ({ repository, path, revision = "HEAD" }) => {
    try {
      // Construct the query to get file content
      const query = `count:1 repo:^${repository}$ file:${path}$ rev:${revision}`;
      const fileContent = await executeSrcCommand("search", ["-json", query]);

      // Format the results
      const formattedContent = formatFileLookupResults(fileContent);
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

// Add a tool to search for React component prop usage
server.tool(
  ToolType.searchReactPropUsage,
  `
    A more specific type of Sourcegraph search.
    Use this tool when the user asks about the usage of a specific prop of a React component.
    This could be helpful for library maintainers when they need to understand the usage of their components.
    Both a prop name and the component name must be specified in the user prompt.
  `,
  {
    propName: z.string().describe("Name of the prop to search for"),
    componentName: z
      .string()
      .describe("Name of the React component that owns the prop"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(25)
      .optional()
      .default(10)
      .describe("Maximum number of results to return"),
  },
  async ({ componentName, propName, limit }) => {
    try {
      // Construct the regex pattern for searching component prop usage
      // The pattern looks for <ComponentName propName=
      const regexPattern = `/<${componentName}\\s+${propName}=/`;
      const query = `${regexPattern} count:${limit}`;

      const searchResults = await executeSrcCommand("search", ["-json", query]);

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
            text: `Error searching for component prop usage: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

////////// PROMPTS ////////////////////
enum PromptType {
  searchForReactPropUsage = "search-for-react-prop-usage",
}

server.prompt(
  PromptType.searchForReactPropUsage,
  {
    propName: z.string(),
    reactComponentName: z.string(),
    searchResultsLimit: z.string().optional(),
  },
  ({ propName, reactComponentName, searchResultsLimit }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `
            Use the ${ToolType.searchReactPropUsage} tool to search for usage of the prop ${propName} of the React component ${reactComponentName}.
            ${searchResultsLimit ? `Limit the results to ${searchResultsLimit} items.` : ""}
            
            Only report back the usage results as a list.
            Each item in the list contains:
              - the name of the file
              - a GitHub link to the line of code that matched the search
              - the code preview snippet 
              
            Wait for the user to prompt further if they they want to examine any of the results further.
          `,
        },
      },
    ],
  }),
);

// Start the server using the stdio transport
const start = async () => {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Log environment variables for debugging (without the token)
    console.error(
      `SRC_ENDPOINT: ${process.env.SRC_ENDPOINT ? "Set" : "Not set"}`,
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
