/**
 * Format search results from src-cli JSON output into a more readable format
 */
export function formatSearchResults(jsonResults: string): string {
  try {
    const results = JSON.parse(jsonResults);
    if (!Array.isArray(results) || results.length === 0) {
      return "No results found.";
    }

    // Format the results into a readable text format
    return results
      .map((result: any, index: number) => {
        let formatted = `Result ${index + 1}:\n`;

        // Repository info
        if (result.repository) {
          formatted += `Repository: ${result.repository}\n`;
        }

        // File path
        if (result.file) {
          formatted += `File: ${result.file}\n`;
        }

        // Line info
        if (result.lineNumber) {
          formatted += `Line: ${result.lineNumber}\n`;
        }

        // Content snippet
        if (result.content) {
          formatted += `\nCode:\n${result.content.trim()}\n`;
        }

        return formatted;
      })
      .join("\n---\n\n");
  } catch (error) {
    console.error("Error parsing search results:", error);
    // Return the original JSON if parsing fails
    return jsonResults;
  }
}

/**
 * Format version information into a readable format
 */
export function formatVersionInfo(versionInfo: string): string {
  // Version info is usually already well-formatted, but we can enhance it
  return `Sourcegraph CLI Version Information:\n${versionInfo}`;
}
