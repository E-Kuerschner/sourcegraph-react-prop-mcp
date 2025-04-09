// TODO need to get TS types for search results
type SearchResultType = {
  repository: { name: string; url: string };
  file: { name: string; path: string; url: string; content: string };
  lineMatches: Array<{
    lineNumber: number;
    preview: string;
  }>;
};

/**
 * Format search results for a single file lookup from src-cli into a more readable format
 */
export function formatFileLookupResults(jsonResults: string): string {
  try {
    const data = JSON.parse(jsonResults);

    // Check if there are no results
    if (!data.Results || data.Results.length === 0) {
      return "No results found.";
    }

    if (data.Results.length > 1) {
      return "Multiple results found. Please narrow your search.";
    }

    const fileResult = data.Results[0];

    // Format the header information
    let formattedOutput = `Search Query: ${data.Query}\n`;
    formattedOutput += `Sourcegraph Instance: ${data.SourcegraphEndpoint}\n`;
    formattedOutput += `File: ${fileResult.file.path}\n`;
    formattedOutput += `URL: ${data.SourcegraphEndpoint}${fileResult.file.url}\n\n`;

    formattedOutput += `File Contents:\n`;
    formattedOutput += `${fileResult.file.content}\n`;

    formattedOutput += "\n\n" + "-".repeat(50) + "\n\n";

    return formattedOutput;
  } catch (error) {
    console.error("Error parsing file contents:", error);
    return `Error formatting results: ${error instanceof Error ? error.message : String(error)}\n\nRaw Response:\n${jsonResults}`;
  }
}

/**
 * Format search results from src-cli JSON output into a more readable format
 */
export function formatSearchResults(jsonResults: string): string {
  try {
    const data = JSON.parse(jsonResults);

    // Check if there are no results
    if (!data.Results || data.Results.length === 0) {
      return "No results found.";
    }

    // Format the header information
    let formattedOutput = `Search Query: ${data.Query}\n`;
    formattedOutput += `Sourcegraph Instance: ${data.SourcegraphEndpoint}\n`;
    formattedOutput += `Result Count: ${data.ResultCount}${data.LimitHit ? " (limit hit)" : ""}\n\n`;

    // Format each result
    data.Results.forEach((result: SearchResultType, index: number) => {
      formattedOutput += `Result ${index + 1}:\n`;

      // Repository info
      if (result.repository) {
        formattedOutput += `Repository: ${result.repository.name}\n`;
        formattedOutput += `Repository url: ${result.repository.url}\n`;
      }

      // File info
      if (result.file) {
        formattedOutput += `File: ${result.file.path}\n`;
        formattedOutput += `URL: ${data.SourcegraphEndpoint}${result.file.url}\n`;
      }

      // Line matches
      if (result.lineMatches && result.lineMatches.length > 0) {
        formattedOutput += "\nMatches:\n";
        result.lineMatches.forEach((match) => {
          formattedOutput += `Line ${match.lineNumber}: ${match.preview}\n`;
        });
      }

      // File content if available
      if (result.file && result.file.content) {
        formattedOutput += "\nFile Content Preview:\n";
        // Show first 10 lines or fewer of content
        const contentLines = result.file.content.split("\n").slice(0, 10);
        formattedOutput +=
          contentLines.join("\n") +
          (contentLines.length >= 10 ? "\n...(truncated)" : "");
      }

      formattedOutput += "\n\n" + "-".repeat(50) + "\n\n";
    });

    return formattedOutput;
  } catch (error) {
    console.error("Error parsing search results:", error);
    return `Error formatting results: ${error instanceof Error ? error.message : String(error)}\n\nRaw Response:\n${jsonResults}`;
  }
}

/**
 * Format version information into a readable format
 */
export function formatVersionInfo(versionInfo: string): string {
  // Version info is usually already well-formatted, but we can enhance it
  return `Sourcegraph CLI Version Information:\n${versionInfo}`;
}
