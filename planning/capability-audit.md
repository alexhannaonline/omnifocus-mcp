# OmniFocus MCP Capability Audit

> Decision doc: what the MCP covers, what it should cover, and what it shouldn't.
> Generated 2026-01-31 from Omni Automation API review.

---

## Decision Summary

| Category | Decision | Priority | Rationale |
|---|---|---|---|
| Task Hierarchies | **YES** | 1 | Core gap. OF is built on hierarchy; MCP currently flattens everything. |
| Folders | **YES** | 2 | Organizational backbone. Agent can't manage structure without this. |
| Notifications | **YES** | 3 | ADHD-relevant. Reminders are how tasks actually get done. |
| Attachments | **YES** | 4 | Useful for linking reference material to tasks. |
| Perspectives | **NO** | — | API is read-only. Can list/export but not create or modify. Not worth it. |
| Review | **MAYBE** | — | `nextReviewDate`/`lastReviewDate` exist on Project. Could add to project tools without new tools. |
| Forecast | **MAYBE** | — | `ForecastDay` class exists. Limited utility beyond what `todays_agenda` already provides. |
| Settings/Preferences | **NO** | — | Not agent-appropriate. Changing app prefs via MCP is a footgun. |
| Email/Mail Drop | **NO** | — | App-level integration, not scriptable in a useful MCP way. |
| Shortcuts | **NO** | — | OS-level integration, not MCP territory. |
| Selection/Window | **NO** | — | UI control, not data. Agent doesn't need to drive the GUI. |
| TaskPaper | EXISTING | — | Already in backlog (TPF1-3). Complements hierarchy work. |

---

## Priority 1: Task Hierarchies

### What's missing
The MCP currently treats tasks as flat. `list_tasks` returns a flat array; `create_task` can only create top-level tasks. No way to:
- Create subtasks under an existing task
- Read the parent/child structure
- Set sequential vs parallel ordering
- Use `completedByChildren` (action groups)
- Navigate up/down the tree

### API available (Omni Automation)
The Task class has rich hierarchy support:

**Properties:**
- `parent` (Task|null, r/o) — parent task
- `children` (Array of Task, r/o) — direct children, library order
- `hasChildren` (Boolean, r/o) — efficient check
- `flattenedTasks` (TaskArray, r/o) — all descendants
- `tasks` (TaskArray, r/o) — alias for children
- `sequential` (Boolean) — whether children are sequential
- `completedByChildren` (Boolean) — auto-complete when children done

**Creation:**
- `new Task(name, position)` — position can be `parentTask.ending` or `parentTask.beginning` to create subtasks
- `task.before` / `task.after` — insertion locations relative to siblings

**Traversal:**
- `task.apply(fn)` — recursive traversal with `ApplyResult` flow control (SkipChildren, SkipPeers, Stop)

### Proposed tools
| Tool | Description |
|---|---|
| `get_task_hierarchy` | Return a task with its full subtask tree (configurable depth) |
| `create_subtask` | Create a task as a child of an existing task, with position control |
| `move_task` | Move a task to a different parent (task or project), with position |
| `set_task_ordering` | Set sequential/parallel and completedByChildren on a parent task |
| `list_subtasks` | List direct children of a task (shallow, for large trees) |

### Notes
- `list_tasks` should gain a `parentId` filter and include `hasChildren`/`parentId` in response
- `create_task` could gain an optional `parentTaskId` instead of a separate tool — but a distinct `create_subtask` is clearer for the agent
- Tree serialization format matters: nested JSON vs flat-with-parentId. Nested is more natural for display; flat is better for large datasets.

---

## Priority 2: Folders

### What's missing
Projects reference folders by name (create_project auto-creates folders). But no way to:
- List folders and their structure
- Create/rename/delete folders directly
- Move projects between folders
- See the folder tree

### API available (Omni Automation)
**Folder class:**
- `name` (String) — folder name
- `status` (Folder.Status) — Active or Dropped
- `parent` (Folder|null, r/o) — parent folder
- `children` (Array, r/o) — child folders and projects
- `folders` (Array, r/o) — child folders only
- `projects` (Array, r/o) — child projects only
- `flattenedFolders` / `flattenedProjects` / `flattenedSections` — recursive access
- `new Folder(name, position)` — create with position control
- `folderNamed(name)` / `projectNamed(name)` — lookup by name
- `Folder.byIdentifier(id)` — lookup by ID
- `apply(fn)` — recursive traversal

**Limitations:**
- No explicit `delete()` method documented. May need `markDropped` or status change.
- Moving items uses `moveSections([items], targetPosition)` on Database.

### Proposed tools
| Tool | Description |
|---|---|
| `list_folders` | List all folders with optional nesting depth, filter by status |
| `create_folder` | Create a folder, optionally nested inside another folder |
| `update_folder` | Rename, change status (active/dropped) |
| `delete_folder` | Drop a folder (with option to orphan or move contents) |
| `get_folder_contents` | List projects and subfolders in a specific folder |
| `move_to_folder` | Move a project or folder into a different folder |

### Notes
- `list_projects` currently shows folder name as a string. Could enrich with folder ID for cross-referencing.
- Folder deletion semantics need testing — OF may not support true deletion via automation, only dropping.

---

## Priority 3: Notifications

### What's missing
No way to view, create, or remove task notifications/reminders. For ADHD workflows, this is the difference between "a task exists" and "a task actually fires at the right moment."

### API available (Omni Automation)
**Task methods:**
- `addNotification(info)` — pass Date for absolute, Number (seconds) for due-relative
- `removeNotification(notification)` — remove specific notification
- `notifications` (Array of Task.Notification, r/o) — existing notifications

**Task.Notification properties:**
- `absoluteFireDate` (Date) — when it fires (absolute only)
- `relativeFireOffset` (Number) — offset in minutes from due date
- `kind` (Task.Notification.Kind) — Absolute, DueRelative, or Unknown
- `initialFireDate` (Date, r/o) — original fire date
- `nextFireDate` (Date|null, r/o) — next fire time
- `isSnoozed` (Boolean, r/o) — snooze status
- `repeatInterval` (Number) — repeat frequency in seconds (0 = none)
- `task` (Task|null, r/o) — back-reference

### Proposed tools
| Tool | Description |
|---|---|
| `list_notifications` | List all notifications on a task |
| `add_notification` | Add absolute (date) or relative (offset from due) notification to a task |
| `remove_notification` | Remove a specific notification from a task |
| `clear_notifications` | Remove all notifications from a task |

### Notes
- Relative notifications error if the task has no due date. Tool should validate and return a clear error.
- `repeatInterval` is settable — could support "remind me every hour until done" patterns.
- Bulk notification operations (e.g., "add morning-of reminder to all flagged tasks") could be powerful but are second-pass.

---

## Priority 4: Attachments

### What's missing
No way to attach files to tasks or read attachment metadata. Useful for linking reference docs, screenshots, receipts.

### API available (Omni Automation)
**Task properties/methods:**
- `attachments` (Array of FileWrapper) — attached files
- `addAttachment(attachment: FileWrapper)` — add file
- `removeAttachmentAtIndex(index: Number)` — remove by position
- `linkedFileURLs` (Array of URL, r/o) — external file links
- `addLinkedFileURL(url: URL)` — link external file
- `removeLinkedFileWithURL(url: URL)` — unlink

**FileWrapper:**
- `FileWrapper.withContents(filename, data)` — create from data
- `preferredFilename` — filename
- `type` — File type
- `contents` — raw data

**Two mechanisms:**
1. **Attachments** — file data stored in OF database. Syncs across devices. Large files degrade performance.
2. **Linked files** — URL references to files on disk. Lightweight. Mac-only (no sync).

### Proposed tools
| Tool | Description |
|---|---|
| `list_attachments` | List attachment metadata (name, type, size) on a task |
| `add_linked_file` | Link an external file by path/URL to a task |
| `remove_attachment` | Remove an attachment by index or filename |
| `remove_linked_file` | Unlink a file reference |

### Notes
- **Full attachment upload is risky via MCP.** FileWrapper.withContents requires binary data passed through JXA. Linked files are safer and more practical for agent use.
- Agent-appropriate pattern: "link this file to that task" rather than "embed this file in the database."
- Reading attachment *contents* is probably out of scope — just metadata (name, type, count).

---

## Deferred / Out of Scope

### Perspectives — NO
- API is **read-only**. Can list custom perspectives and export them as FileWrappers.
- Cannot create or modify perspectives programmatically.
- Not worth building tools for read-only access to something the user manages in the app.

### Review — MAYBE (enrich existing tools)
- `Project.ReviewInterval` provides `nextReviewDate` and `lastReviewDate`.
- Rather than new tools, could add review fields to `list_projects` response and `update_project` input.
- Worth doing when the weekly-review workflow matures.

### Forecast — MAYBE (low priority)
- `ForecastDay` class exists with `date`, `badgeCount`, `kind`, `status`.
- `todays_agenda` already covers the primary use case.
- A `get_forecast` tool showing the next N days could help with planning, but it's incremental.

### Settings/Preferences — NO
- Modifying app settings via an agent is dangerous and unnecessary.

### Email/Mail Drop — NO
- This is an app-level feature, not scriptable in a way that adds value via MCP.

### Shortcuts — NO
- OS-level integration. Agent should call OF directly, not go through Shortcuts.

### Selection/Window Control — NO
- UI manipulation. Agent operates on data, not the GUI.

---

*This doc informs the Ralph Wiggum prompt for autonomous implementation.*
