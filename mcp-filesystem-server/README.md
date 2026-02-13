# MCP Filesystem Server

A local Model Context Protocol (MCP) server that provides file system operations.

## Features

- **read_file**: Read contents of a file
- **write_file**: Write content to a file
- **list_directory**: List contents of a directory
- **create_directory**: Create a new directory

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Configuration

Add this server to your Claude Code MCP configuration at `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["C:\\Users\\Qi(Jessica)Jiang\\src\\mcp-filesystem-server\\dist\\index.js"],
      "env": {
        "MCP_BASE_DIR": "C:\\Users\\Qi(Jessica)Jiang\\src"
      }
    }
  }
}
```

**Important**: Change `MCP_BASE_DIR` to the directory you want to allow access to. The server will only be able to read/write files within this directory for security.

## Usage

After configuring, restart Claude Code. The server will provide tools for file system operations.

## Development

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Build and run the server
- `npm start`: Run the built server

## Security

The server enforces path security by:
- Only allowing access to files within `MCP_BASE_DIR`
- Rejecting any paths that try to escape the base directory
