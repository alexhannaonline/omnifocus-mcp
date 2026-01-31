# OmniFocus MCP Server

An MCP server that gives AI assistants full access to OmniFocus via Omni Automation. 41 tools for tasks, projects, folders, tags, subtask hierarchies, notifications, attachments, analytics, and data export.

## How it works

The server runs `osascript -l JavaScript` to call `app.evaluateJavascript()`, which executes scripts inside OmniFocus's native Omni Automation engine. No direct database access — all interaction goes through the official API.

## Installation

```bash
git clone https://github.com/alexhanna/omnifocus-mcp.git
cd omnifocus-mcp
npm install
npm run build
```

### MCP client configuration

Add the server to your MCP client's configuration. The server entry looks like:

```json
{
  "mcpServers": {
    "omnifocus": {
      "command": "node",
      "args": ["/path/to/omnifocus-mcp/dist/index.js"],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

Where this lives depends on your client:
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Code**: `~/.claude/settings.json` or project `.mcp.json`
- **Other MCP clients**: consult your client's documentation for server configuration

### Requirements

- macOS (required for osascript)
- OmniFocus 4.6+ installed
- Node.js 18+
- macOS automation permission for OmniFocus (granted on first use — see [docs/PERMISSIONS.md](docs/PERMISSIONS.md))

## Tools

### Tasks (7 tools)
| Tool | Description |
|---|---|
| `list_tasks` | Filter by completion, flags, project, tags, dates, search, inbox, availability. Cached 30s. |
| `get_task_count` | Count matching tasks without returning data. |
| `todays_agenda` | Tasks due today, overdue, or flagged. |
| `create_task` | Create task with name, note, flags, dates, tags, project, estimated time. |
| `update_task` | Modify any task property. Move between projects. |
| `complete_task` | Mark task completed. |
| `delete_task` | Remove task. |

### Projects (5 tools)
| Tool | Description |
|---|---|
| `list_projects` | Filter by status, flags, folder. Cached 5min. |
| `create_project` | Create with folder placement (auto-creates folder if needed). |
| `update_project` | Change properties, move between folders. |
| `complete_project` | Mark project done (optionally complete all tasks). |
| `delete_project` | Remove project. |

### Folders (6 tools)
| Tool | Description |
|---|---|
| `list_folders` | List with nesting depth and status filter. |
| `create_folder` | Create folder, optionally nested. |
| `update_folder` | Rename, change status. |
| `delete_folder` | Drop folder (optionally move contents first). |
| `get_folder_contents` | List projects and subfolders in a folder. |
| `move_to_folder` | Move project or folder into a different folder. |

### Task Hierarchies (5 tools)
| Tool | Description |
|---|---|
| `get_task_hierarchy` | Get task with full subtask tree (configurable depth). |
| `create_subtask` | Create child task with position control. |
| `move_task` | Move task to different parent or project root. |
| `set_task_ordering` | Set sequential/parallel and completedByChildren. |
| `list_subtasks` | List direct children of a task. |

### Tags (2 tools)
| Tool | Description |
|---|---|
| `list_tags` | List all tags. Optional (expensive) usage statistics. |
| `manage_tags` | Create, rename, delete, merge tags. Supports nested tags via `parentTag`. |

### Notifications (4 tools)
| Tool | Description |
|---|---|
| `list_notifications` | List all notifications on a task. |
| `add_notification` | Add absolute (date) or relative (offset from due) notification. |
| `remove_notification` | Remove notification by index. |
| `clear_notifications` | Remove all notifications from a task. |

### Attachments (4 tools)
| Tool | Description |
|---|---|
| `list_attachments` | List attachment metadata and linked files on a task. |
| `add_linked_file` | Link a `file://` path to a task. |
| `remove_attachment` | Remove embedded attachment by index. |
| `remove_linked_file` | Unlink a file reference. |

### Analytics (3 tools)
| Tool | Description |
|---|---|
| `get_productivity_stats` | Completion rates, time distribution. Group by project/tag/day/week. |
| `get_task_velocity` | Task throughput over day/week/month. |
| `analyze_overdue_tasks` | Overdue patterns grouped by project/tag/age/priority. |

### Recurring Tasks (2 tools)
| Tool | Description |
|---|---|
| `analyze_recurring_tasks` | List recurring tasks with frequency and due dates. |
| `get_recurring_patterns` | Statistics about recurring task frequencies. |

### Export (3 tools)
| Tool | Description |
|---|---|
| `export_tasks` | Export tasks as JSON or CSV with field selection. |
| `export_projects` | Export projects with optional statistics. |
| `bulk_export` | Export all data (tasks, projects, tags) to files. |

## Architecture

```
src/
├── cache/           # TTL-based caching (30s tasks, 5min projects, 1h analytics)
├── omnifocus/
│   ├── OmniAutomation.ts   # Bridge: osascript → evaluateJavascript()
│   ├── scripts/             # Omni Automation script templates
│   └── types.ts             # Type definitions
├── tools/           # 41 MCP tools in 10 domain directories
│   ├── tasks/       ├── projects/    ├── folders/
│   ├── hierarchy/   ├── tags/        ├── notifications/
│   ├── attachments/ ├── analytics/   ├── recurring/
│   └── export/
├── utils/           # Logging, permission checking
└── index.ts         # Server entry point
```

**Script execution flow:**
1. Tool calls `omniAutomation.buildScript(template, params)` — replaces `{{placeholders}}` with `JSON.stringify`-escaped values
2. `wrapScript()` wraps the script in a try/catch IIFE
3. The wrapped script is `JSON.stringify`-escaped again and passed to `app.evaluateJavascript()`
4. `osascript -l JavaScript` runs the outer JXA wrapper
5. JSON result is parsed and returned through MCP

## Known limitations

- **No recurring task creation** — can read recurring patterns but cannot create repeat rules
- **No perspective management** — Omni Automation API is read-only for perspectives
- **No location-based tags** — must be set manually in OmniFocus UI
- **`add_linked_file` only accepts `file://` URLs** — OmniFocus rejects http/https
- **MCP server caches builds** — Claude Code must restart to pick up `npm run build` changes
- **No review/perspective management** via automation

## Development

```bash
npm run build     # Compile TypeScript
npm run dev       # Watch mode
npm test          # Unit tests (vitest)
npm run typecheck # Type check without building
```

## License

MIT — see [LICENSE](LICENSE)
