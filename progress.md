# Progress

> Append-only log of learnings, gotchas, and context for agents working on this repo.
> Each entry should be a single line or short block. Don't edit previous entries — just append.

---

- Omni Automation scripts run inside OmniFocus's native JS engine via `app.evaluateJavascript()`. They use globals (`flattenedTasks`, `inbox`, `tags`, etc.), NOT `Application.current.document`. The JXA wrapper only exists to call `evaluateJavascript`.
- Position endpoints are on the container directly: `parentTask.ending`, `folder.ending`. NOT `.children.ending` or `.projects.ending`. The latter silently fails.
- `project.status.name` returns undefined in Omni Automation. Must compare against enum values like `Project.Status.Active`.
- OmniFocus rejects `null` for the `note` property. Convert to empty string when clearing.
- `const folders = []` in a script shadows the global `folders` SectionArray. Same for `projects`, `tags`. Use different variable names (`result`, `allProjects`, `allFolders`).
- `deleteObject()` must come before heavy iteration — objects become stale references after deletion.
- `new Task(name, parentTask.ending)` returns the new task directly — use `.id.primaryKey` on the return value. Don't search children by name.
- `add_linked_file` only accepts `file://` URLs. OmniFocus rejects http/https.
- MCP server caches old builds until Claude Code restarts. After `npm run build`, the host process must restart to pick up changes.
- Unit tests verify script template strings, not actual OmniFocus behavior. Passing unit tests do NOT mean the scripts work in OmniFocus. Always verify against the real app.
- Tag creation supports nesting via `new Tag(tagName, parentTagObj.ending)`. Duplicate check should be scoped to siblings, not global.
- `npm audit fix` can update the MCP SDK, which may change `protocolVersion` in tests. Check `integration.test.ts` if tests break after dependency updates.
