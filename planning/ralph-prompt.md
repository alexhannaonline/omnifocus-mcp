# Ralph Prompt: OmniFocus MCP Capability Expansion

You are working in `/Users/alexhanna/Coding_Projects/omnifocus-mcp`.

## Your Mission

Implement 19 new MCP tools across 4 capability groups, following the spec in `planning/capability-audit.md`. Work in priority order. After each group: build, test, commit.

## FIRST: Check What's Already Done

You may be a continuation of a previous session. Before doing anything else:

1. Run `git log --oneline -10` to see recent commits
2. Check which tool group directories already exist: `ls src/tools/hierarchy src/tools/folders src/tools/notifications src/tools/attachments 2>/dev/null`
3. Run `npm run build && npm test 2>&1 | tail -10` to see current state

**Skip any group that already has a commit** (look for `feat(hierarchy):`, `feat(folders):`, `feat(notifications):`, `feat(attachments):` in git log). Pick up from the first incomplete group. If a group was partially implemented but not committed, finish it.

If all 4 groups are committed, build passes, and tests pass — go straight to the Final Checklist and output the completion promise.

## Architecture Rules

**Read these files first** to understand existing patterns:
- `src/tools/base.ts` — BaseTool abstract class (all tools extend this)
- `src/tools/index.ts` — tool registration (imports + array + handlers)
- `src/tools/tasks/CreateTaskTool.ts` — example tool implementation
- `src/omnifocus/OmniAutomation.ts` — JXA execution engine (buildScript, execute, wrapScript)
- `src/omnifocus/scripts/tasks.ts` — example JXA script templates
- `src/omnifocus/types.ts` — type definitions
- `tests/unit/tag-operations.test.ts` — example unit test pattern
- `vitest.config.ts` — test configuration

**Follow these patterns exactly:**
1. Each tool is a class extending `BaseTool` in its own file under `src/tools/{group}/`
2. JXA scripts are exported string templates in `src/omnifocus/scripts/{group}.ts`
3. Scripts use `{{placeholder}}` syntax, filled by `omniAutomation.buildScript()`
4. Scripts are wrapped by OmniAutomation — they receive `app` and `doc` in scope (do NOT declare these)
5. All scripts must `return JSON.stringify(result)` — the wrapper parses the output
6. Tools parse the result: `typeof result === 'string' ? JSON.parse(result) : result`
7. Write operations must call `this.cache.invalidate('tasks')` (or appropriate category)
8. Use `type: 'object' as const` in inputSchema
9. Register tools in `src/tools/index.ts` following the existing import/instantiation pattern

**JXA API patterns** (OmniFocus Omni Automation):
- Properties are method calls: `task.name()`, `task.id()`, `task.parent()`
- Setting properties: `task.name = "new name"` (direct assignment)
- Creating tasks as subtasks: `new Task(name, parentTask.ending)` or `parentTask.beginning`
- Folder creation: `new Folder(name, position)` — position can be `doc.folders.ending`, `parentFolder.folders.ending`
- Moving items: `moveTasks([task], position)` or `moveSections([section], position)` on Database
- Task notifications: `task.addNotification(date)` for absolute, `task.addNotification(offsetSeconds)` for relative
- Task linked files: `task.addLinkedFileURL(URL.fromString(path))`, `task.removeLinkedFileWithURL(url)`
- Folder lookup: `doc.folders.byId(id)` or iterate `doc.flattenedFolders()`
- Task lookup: `doc.flattenedTasks.byId(id)` or iterate

**IMPORTANT JXA caveats:**
- `id` access varies: some objects use `task.id()`, some use `task.id.primaryKey` — test both patterns if one fails
- Always wrap property access in try/catch — JXA silently converts types in unexpected ways
- Array methods on JXA proxy arrays sometimes fail — convert with `Array.from()` or manual iteration
- `flattenedTasks()`, `flattenedProjects()`, `flattenedFolders()` return ALL descendants recursively
- `tasks()`, `projects()`, `folders()` return direct children only

## SAFETY: Do Not Touch Live OmniFocus

**NEVER run `osascript` directly.** Do not execute JXA scripts against the real OmniFocus database. Do not run integration tests (`npm run test:integration`). Only run unit tests (`npm test`).

Your job is to write code that compiles and passes unit tests. Unit tests verify script template strings — they do NOT execute against OmniFocus. Real OmniFocus interaction will be tested manually by a human after you're done.

If a script template doesn't look right, fix it by reading the code — do NOT try to run it against OmniFocus to see what happens.

## Baseline State

There are 12 pre-existing test failures (25 failed assertions across 17 test files). These are NOT your fault — they're from earlier script changes that drifted from their regression tests. **Your success criteria: the 5 currently-passing test files stay passing, and all new test files pass.** Do not fix pre-existing failures unless they're trivially broken.

Run `npm test 2>&1 | tail -5` to check the summary line. The baseline is:
```
Test Files  12 failed | 5 passed (17)
Tests  25 failed | 41 passed | 1 skipped (67)
```

Your target: the `passed` counts increase by your new tests; the `failed` counts stay the same or decrease.

## Implementation Order

### Group 1: Task Hierarchies (`feat(hierarchy):`)

**New files:**
- `src/omnifocus/scripts/hierarchy.ts` — JXA scripts
- `src/tools/hierarchy/GetTaskHierarchyTool.ts`
- `src/tools/hierarchy/CreateSubtaskTool.ts`
- `src/tools/hierarchy/MoveTaskTool.ts`
- `src/tools/hierarchy/SetTaskOrderingTool.ts`
- `src/tools/hierarchy/ListSubtasksTool.ts`
- `tests/unit/hierarchy.test.ts`

**Tools:**

1. `get_task_hierarchy` — Given a taskId, return the task with its full subtask tree. Accept optional `depth` parameter (default: unlimited). Return nested JSON with each node having `{id, name, completed, flagged, children: [...]}`.

2. `create_subtask` — Create a task as a child of an existing task. Parameters: `parentTaskId` (required), `name` (required), `note`, `flagged`, `dueDate`, `deferDate`, `estimatedMinutes`, `tags`, `position` (optional: "beginning" or "ending", default "ending"). Use `new Task(name, parentTask.ending)` pattern.

3. `move_task` — Move a task to a different parent. Parameters: `taskId` (required), `parentTaskId` (optional — if omitted, move to project root or inbox), `position` (optional: "beginning" or "ending"). Use `moveTasks([task], destination)`.

4. `set_task_ordering` — Set sequential/parallel and completedByChildren on a task. Parameters: `taskId` (required), `sequential` (boolean), `completedByChildren` (boolean).

5. `list_subtasks` — List direct children of a task. Parameters: `taskId` (required). Return flat array of child task summaries.

**Also:** Enrich `list_tasks` response — add `hasChildren` and `parentId` fields to the task objects returned by `ListTasksTool`. This requires modifying the LIST_TASKS_SCRIPT in `src/omnifocus/scripts/tasks.ts`. Be careful not to break the existing script — add the fields alongside existing ones.

**Tests:** Verify script templates contain expected patterns (like existing tests do). Test that scripts include `JSON.stringify`, correct property access patterns, placeholder usage.

**After completing:** `npm run build && npm test` — must build clean and new tests pass. Then: `git add -A && git commit -m "feat(hierarchy): add task hierarchy tools (5 tools + list_tasks enrichment)"`

### Group 2: Folders (`feat(folders):`)

**New files:**
- `src/omnifocus/scripts/folders.ts`
- `src/tools/folders/ListFoldersTool.ts`
- `src/tools/folders/CreateFolderTool.ts`
- `src/tools/folders/UpdateFolderTool.ts`
- `src/tools/folders/DeleteFolderTool.ts`
- `src/tools/folders/GetFolderContentsTool.ts`
- `src/tools/folders/MoveToFolderTool.ts`
- `tests/unit/folders.test.ts`

**Tools:**

1. `list_folders` — List all folders. Optional `depth` (nesting depth to return, default unlimited), `status` filter (active/dropped). Return nested structure: `{id, name, status, children: [folders], projectCount}`.

2. `create_folder` — Create a folder. Parameters: `name` (required), `parentFolderId` (optional — nest inside another folder). Use `new Folder(name, position)`.

3. `update_folder` — Update folder properties. Parameters: `folderId` (required), `name` (optional), `status` (optional: "active"/"dropped").

4. `delete_folder` — Drop a folder. Parameters: `folderId` (required), `moveContentsTo` (optional folderId — move children here before dropping). Set `folder.status = Folder.Status.Dropped`.

5. `get_folder_contents` — List contents of a specific folder. Parameters: `folderId` (required). Return `{projects: [...], folders: [...]}`.

6. `move_to_folder` — Move a project or folder into a different folder. Parameters: `itemId` (required), `itemType` ("project" or "folder"), `targetFolderId` (required). Use `moveSections()` or `moveProjects()`.

**Tests:** Same pattern — verify script templates.

**After completing:** Build, test, commit: `git add -A && git commit -m "feat(folders): add folder management tools (6 tools)"`

### Group 3: Notifications (`feat(notifications):`)

**New files:**
- `src/omnifocus/scripts/notifications.ts`
- `src/tools/notifications/ListNotificationsTool.ts`
- `src/tools/notifications/AddNotificationTool.ts`
- `src/tools/notifications/RemoveNotificationTool.ts`
- `src/tools/notifications/ClearNotificationsTool.ts`
- `tests/unit/notifications.test.ts`

**Tools:**

1. `list_notifications` — List all notifications on a task. Parameters: `taskId` (required). Return array of `{kind, absoluteFireDate, relativeFireOffset, nextFireDate, isSnoozed, repeatInterval}`.

2. `add_notification` — Add a notification. Parameters: `taskId` (required), `type` ("absolute" or "relative"), `date` (ISO string, for absolute), `offsetMinutes` (number, for relative — negative means before due date), `repeatInterval` (optional, seconds). Validate: relative notifications require a due date on the task.

3. `remove_notification` — Remove a specific notification. Parameters: `taskId` (required), `index` (number — index in the notifications array). Use `task.removeNotification(notification)`.

4. `clear_notifications` — Remove all notifications from a task. Parameters: `taskId` (required). Iterate and remove all.

**Tests:** Verify script templates.

**After completing:** Build, test, commit: `git add -A && git commit -m "feat(notifications): add notification management tools (4 tools)"`

### Group 4: Attachments (`feat(attachments):`)

**New files:**
- `src/omnifocus/scripts/attachments.ts`
- `src/tools/attachments/ListAttachmentsTool.ts`
- `src/tools/attachments/AddLinkedFileTool.ts`
- `src/tools/attachments/RemoveAttachmentTool.ts`
- `src/tools/attachments/RemoveLinkedFileTool.ts`
- `tests/unit/attachments.test.ts`

**Tools:**

1. `list_attachments` — List attachment metadata on a task. Parameters: `taskId` (required). Return `{attachments: [{name, type}], linkedFiles: [{url}]}`.

2. `add_linked_file` — Link an external file to a task. Parameters: `taskId` (required), `path` (string — file path or URL). Use `task.addLinkedFileURL(URL.fromString(path))`.

3. `remove_attachment` — Remove an embedded attachment by index. Parameters: `taskId` (required), `index` (number). Use `task.removeAttachmentAtIndex(index)`.

4. `remove_linked_file` — Unlink a file reference. Parameters: `taskId` (required), `url` (string). Use `task.removeLinkedFileWithURL(URL.fromString(url))`.

**Tests:** Verify script templates.

**After completing:** Build, test, commit: `git add -A && git commit -m "feat(attachments): add attachment management tools (4 tools)"`

## Type Additions

Add to `src/omnifocus/types.ts` as needed:
- `OmniFocusFolder` interface (id, name, status, parent, children)
- `OmniFocusNotification` interface (kind, absoluteFireDate, relativeFireOffset, etc.)
- `TaskHierarchyNode` interface (extends task with children array)

## Final Checklist

Before declaring completion, verify ALL of these:
1. `npm run build` — zero TypeScript errors
2. `npm test` — all new test files pass, no new failures introduced
3. All 19 tools registered in `src/tools/index.ts`
4. Each group has its own commit
5. `git log --oneline -4` shows all 4 feat commits

**Only after all 5 checks pass**, output this EXACT string as the very last line of your response (no other text after it):

ALL TOOLS IMPLEMENTED AND TESTS PASSING

Do NOT output that string anywhere else in your response. Do NOT quote it, discuss it, or mention it until you are ready to declare completion. If you haven't finished all groups, do NOT output it — just describe what you accomplished and what remains.
