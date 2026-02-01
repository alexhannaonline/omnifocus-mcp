# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Overview

MCP server for OmniFocus, using Omni Automation (via `evaluateJavascript`) to interact with OmniFocus's native JS engine. 41 tools across 10 domains: tasks, projects, tags, folders, hierarchy, notifications, attachments, analytics, recurring, and export.

## Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript (required before running)
npm run dev          # Watch mode
npm start            # Run compiled server from dist/
npm test             # Run unit tests (vitest)
npm run typecheck    # Type checking without building
```

## Architecture

- **src/cache/**: TTL-based caching with automatic invalidation on writes
- **src/omnifocus/OmniAutomation.ts**: Bridge to OmniFocus — wraps scripts in `evaluateJavascript()` via `osascript -l JavaScript`
- **src/omnifocus/scripts/**: Omni Automation script templates (TypeScript string templates with `{{placeholder}}` syntax)
- **src/tools/**: MCP tool implementations organized by domain (tasks, projects, tags, folders, hierarchy, notifications, attachments, analytics, recurring, export)
- **src/tools/base.ts**: BaseTool abstract class all tools extend
- **src/tools/index.ts**: Tool registration — imports and wires all 41 tools
- **src/utils/**: Logging and permission checking

### Key Patterns

1. **Omni Automation only** — all OmniFocus interaction goes through `app.evaluateJavascript()`. Scripts use global accessors (`flattenedTasks`, `flattenedProjects`, `inbox`, etc.), not `Application.current.document`.
2. **Script templates** use `{{placeholder}}` syntax, filled by `OmniAutomation.buildScript()`. Parameters are escaped via `formatValue()` which uses `JSON.stringify` for strings.
3. **All scripts must** `return JSON.stringify(result)` — the wrapper parses JSON output.
4. **Cache invalidation** — write operations call `this.cache.invalidate('tasks')` (or appropriate category).
5. **IDs** — OmniFocus returns stable `id.primaryKey` strings. No temporary IDs.

## Testing

```bash
npm test             # Unit tests only (vitest) — safe, no OmniFocus interaction
```

Unit tests verify script template strings and tool schemas. They do NOT execute against OmniFocus.

## Common Issues

- **MCP server serves stale build**: Claude Code must restart to pick up `npm run build` changes.
- **`add_linked_file`**: OmniFocus only accepts `file://` URLs despite the description mentioning https.
- **Tag nesting**: `manage_tags` create action supports `parentTag` parameter for child tags.

## Progress Log

**Read `progress.md` before making changes.** It contains accumulated gotchas and learnings from previous sessions (Omni Automation quirks, variable shadowing traps, testing caveats, etc.).

**Append to `progress.md`** when you discover something surprising — a bug, a workaround, an API behavior that wasn't obvious. One line per learning. Don't edit previous entries.

## TypeScript

All code is TypeScript. Do not create `.js` files. This includes tests and scripts.
