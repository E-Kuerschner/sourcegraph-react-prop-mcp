# Sourcegraph MCP Server Examples

This document provides examples of how to use the Sourcegraph MCP Server with different tools.

## Testing Connectivity

Use the `testSourcegraphConnection` tool to verify that your Sourcegraph connection is working correctly:

```
Test if the Sourcegraph connection is working correctly
```

## Basic Search Queries

Use the `search` tool to find code across repositories:

### Search for a specific function

```
Search for repositories using 'fmt.Sprintf' in Go code
```

Expected tool call:
```json
{
  "name": "search",
  "arguments": {
    "query": "fmt.Sprintf lang:go",
    "limit": 5
  }
}
```

### Find usages of a specific library

```
Search for uses of 'tensorflow' in Python code, limited to 3 results
```

Expected tool call:
```json
{
  "name": "search",
  "arguments": {
    "query": "import tensorflow lang:python",
    "limit": 3
  }
}
```

### Search in a specific repository

```
Find all instances of 'TODO' in the 'github.com/sourcegraph/src-cli' repository
```

Expected tool call:
```json
{
  "name": "search",
  "arguments": {
    "query": "TODO repo:^github\\.com/sourcegraph/src-cli$"
  }
}
```

## Getting File Contents

Use the `getFileContent` tool to retrieve a specific file:

```
Get the README.md file from the sourcegraph/src-cli repository
```

Expected tool call:
```json
{
  "name": "getFileContent",
  "arguments": {
    "repository": "github.com/sourcegraph/src-cli",
    "path": "README.md"
  }
}
```

### Get a file from a specific branch

```
Get the package.json file from the main branch of the react repository
```

Expected tool call:
```json
{
  "name": "getFileContent",
  "arguments": {
    "repository": "github.com/facebook/react",
    "path": "package.json",
    "revision": "main"
  }
}
```

## Search Syntax Tips

Sourcegraph uses a powerful search syntax. Here are some examples:

- `repo:github.com/user/repo` - Search in a specific repository
- `file:\.js$` - Search only in JavaScript files
- `lang:python` - Search only in Python files
- `case:yes` - Case-sensitive search
- `-file:test` - Exclude test files
- `count:1000` - Return up to 1000 results

For more search syntax options, refer to the [Sourcegraph search documentation](https://docs.sourcegraph.com/code_search/reference/queries).