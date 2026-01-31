# Session Notes: JXA → Omni Automation Migration

## Status: Migration complete, all live testing done

### What was done (session 1)

1. **Core bridge change** (`src/omnifocus/OmniAutomation.ts`):
   - `wrapScript()` now uses `app.evaluateJavascript(jsonEscaped)` to run scripts in OmniFocus's native JS engine
   - Uses `JSON.stringify()` to safely escape script strings for the JXA→OmniFocus boundary

2. **All 10 script files rewritten** to Omni Automation syntax:
   - `new Task(name, inbox.ending)` instead of `app.InboxTask()`
   - `task.id.primaryKey` instead of `task.id()`
   - `task.addTag(tag)` instead of `task.addTags([tag])` (singular)
   - `deleteObject(obj)` instead of `app.delete(obj)`
   - `moveTasks()` / `moveSections()` as top-level functions
   - `task.markComplete()` instead of `task.completed = true`

3. **Globals, not document** — `Application.current.document` is undefined in `evaluateJavascript` context. Fixed all scripts to use direct globals:
   - `flattenedTasks`, `flattenedProjects`, `flattenedTags`, `flattenedFolders`
   - `inbox` (was `doc.inboxTasks`), `tags`, `projects`, `folders`

4. **Status enum fix** — `project.status.name` returns undefined in Omni Automation. Added helper functions (`getProjectStatus()`, `getFolderStatus()`) that compare against enum values like `Project.Status.Active`.

5. **deleteObject reference invalidation** — Moving `deleteObject()` before heavy iteration loops in tag deletion to prevent stale references.

6. **Folders TDZ bug** — `const folders = []` shadowed the global `folders` in `LIST_FOLDERS_SCRIPT`. Renamed to `result`.

7. **Dead code removed**: `tasks-fix.ts`, `tags-simple.ts`, `export-fix.ts`, `safe-access.ts`, `src/omnifocus/utils/`

### What was done (session 2)

8. **Null property bug** — `formatValue()` converts `undefined` to `null`, but scripts checked `!== undefined` which passes for `null`. OmniFocus rejects `null` for `note` property. Fixed:
   - `hierarchy.ts` CREATE_SUBTASK: changed all `!== undefined` checks to `!= null` (catches both null and undefined)
   - `tasks.ts` CREATE_TASK: same fix
   - `tasks.ts` UPDATE_TASK (both scripts): `task.note = updates.note || ''` to convert null to empty string when clearing

9. **Position endpoint bug** — In Omni Automation, position endpoints are on the container directly (`.beginning`/`.ending`), NOT on `.children`, `.projects`, or `.folders`. The pattern `folder.children.ending` silently fails or creates items in wrong location. Fixed ALL scripts to use `container.ending`/`container.beginning`:
   - `hierarchy.ts` CREATE_SUBTASK: `parentTask.ending` (was `parentTask.children.ending`)
   - `hierarchy.ts` MOVE_TASK: `parentTask.ending`, `containingProject.ending` (was `.children.ending`)
   - `folders.ts` CREATE_FOLDER: `parentFolder.ending`
   - `folders.ts` DELETE_FOLDER: `targetFolder.ending` (both folder and project moves)
   - `folders.ts` MOVE_TO_FOLDER: `targetFolder.ending` (both folder and project cases)
   - `projects.ts` CREATE_PROJECT: `targetFolder.ending`
   - `projects.ts` UPDATE_PROJECT: `targetFolder.beginning`
   - Source: [omni-automation.com](https://omni-automation.com/omnifocus/plug-in-task-with-task.html) confirms `task.ending` pattern

10. **Subtask ID retrieval** — Simplified to use `newTask.id.primaryKey` directly from the `new Task()` return value instead of searching `parentTask.children` by name (which was returning null).

11. **Variable shadowing in UPDATE_PROJECT_SCRIPT** — `const projects = flattenedProjects` shadowed the global `projects` SectionArray, breaking `moveSections([targetProject], projects.beginning)` for move-to-root. Renamed to `allProjects`. Similar fix for `const folders = flattenedFolders` → `allFolders`.

12. **Tests**: 104 passing, build clean. Updated 4 test files to match new patterns.

### Live-verified working
- list_tasks, list_projects (with status filter), list_tags, list_folders
- create_task, delete_task, update_task
- create_project, update_project, complete_project, delete_project
- manage_tags (create, delete)
- todays_agenda, get_task_count, analyze_overdue_tasks
- get_productivity_stats, get_task_velocity
- analyze_recurring_tasks, get_recurring_patterns
- export_tasks (JSON + CSV), export_projects
- get_task_hierarchy, list_subtasks, set_task_ordering
- list_notifications, add_notification, remove_notification
- list_attachments
- create_folder, update_folder, delete_folder, get_folder_contents

### Live-verified working (session 4 — after MCP server restart)
- create_subtask (with note, without note) — position + null property + ID fixes confirmed
- move_task (reparent subtask) — position fix confirmed
- move_to_folder (project into subfolder) — position fix confirmed
- create_project with folder — position fix confirmed
- update_project with folder move — position + allProjects fix confirmed
- create_folder with parent — position fix confirmed
- delete_folder with moveContentsTo — position fix confirmed
- bulk_export (JSON, 179 tasks / 27 projects / 80 tags)
- add_linked_file (file:// URLs only — http/https rejected by OmniFocus)
- remove_linked_file
- clear_notifications

### What was done (session 4)

13. **Nested tag support** — `manage_tags` create action now accepts optional `parentTag` parameter. Creates child tags via `new Tag(tagName, parentTagObj.ending)` instead of always using top-level `tags.ending`. Duplicate check scoped to siblings. Returns `tagId` and `parentTag` in response.
    - `src/tools/tags/ManageTagsTool.ts`: added `parentTag` to schema and execute args
    - `src/omnifocus/scripts/tags.ts`: MANAGE_TAGS_SCRIPT create case rewritten with parent lookup
    - **Live-tested and verified** — parent with 2 children, hierarchy confirmed via list_tags

14. **Stale test artifact cleanup** — 7 flagged "Test task from integration test" items deleted from inbox (leftover from earlier sessions).

### Known issues
- `tests/integration/mcp-server.test.ts` — standalone script, not a vitest suite (pre-existing)
- `tests/unit/integration.test.ts` — `total_items` metadata mismatch (1 test, pre-existing)
- MCP server requires restart (Claude Code restart) to pick up rebuilds — "ralph loop" friction
- `add_linked_file` description says it accepts URLs, but OmniFocus only accepts `file://` paths

### Test artifacts cleaned up
- Session 1: 24 test tags, 4 OMNIAUTOMATION_* tasks, 11 integration test tasks, 2 test projects
- Session 2: 3 "Test task from integration test", 1 "Test task with apostrophe's", 1 "MCP live test" task, 1 "MCP Test Project", 1 "MCP Test Folder"
- Session 3: 2 "Subtask A", 1 "Subtask A (no note)", 1 "Subtask B (after fix)", 1 "MCP restart test" parent task
- Session 4: "MCP Live Test Session 4" project, "MCP Folder Move Test S4" project, "MCP Test Folder S4" + subfolder, "S4 Parent Task" + 2 subtasks, /tmp/mcp-bulk-export-test/
- Session 4 (demo): "Demo: Home Projects" folder tree, "Backsplash install" project + 5 tasks, "demo-hardware-store" tag, "demo-errands" + 2 child tags, 7 stale "Test task from integration test" items
