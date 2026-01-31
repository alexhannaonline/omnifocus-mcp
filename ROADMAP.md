# Roadmap: Post-Migration Finalization

> Created 2026-01-31 after completing the JXA → Omni Automation migration.
> Each pass is a standalone session. Pick up wherever you left off.

---

## Pass 1: Hygiene

**Goal:** Clean codebase, no dead code, no stale references.

### Files to audit

- [ ] `CLAUDE.md` — still references JXA, "temporary IDs", has duplicated lines at bottom, mentions cucumber/gherkin tests that may not exist, references skills that don't apply
- [ ] `README.md` — still says "JXA limitation" for task IDs, references JXA throughout, tool descriptions may be outdated (e.g. `create_task` says "Returns temporary ID")
- [ ] `CHANGELOG.md` — review whether it needs a migration entry
- [ ] `BUG3-RESOLUTION.md` — possibly obsolete, check if bugs are pre-migration
- [ ] `docs/` — 8 files, likely stale (cucumber-testing-guide, prompt-plugin-architecture, etc.)
- [ ] `planning/` — backlog.md, story-map.md, user-stories.md — check if still relevant post-migration
- [ ] Top-level debug/test files — `debug-*.ts`, `test-*.ts`, `ralph-loop.sh`, `.ralph-logs/`, `2026-01-31-*.txt` — likely safe to remove
- [ ] `SESSION-NOTES.md` — served its purpose during migration; archive or remove for public release
- [ ] `src/omnifocus/scripts/` — check for dead JXA patterns, commented-out code, TODO comments that are resolved
- [ ] `src/tools/` — verify all 14 tool subdirectories match actual registered tools
- [ ] `tests/` — the 2 known-failing tests (mcp-server.test.ts standalone script, integration.test.ts total_items mismatch) — fix or remove
- [ ] `package.json` — check for unused dependencies, verify scripts section is accurate

### Patterns to look for
- Any remaining `app.InboxTask`, `task.id()`, `task.addTags([])`, `app.delete()` — old JXA patterns
- References to "JXA" in code comments or docs (should say "Omni Automation" or "evaluateJavascript")
- Dead imports, unused exports
- `console.log` debug statements left in production code
- Duplicated or garbled text (CLAUDE.md has triple-repeated lines)

---

## Pass 2: Security

**Goal:** Safe for public release. No secrets, no injection vectors, no footguns.

### Input sanitization
- [ ] `OmniAutomation.ts` — `buildScript()` uses `formatValue()` to inject parameters into script templates. Audit how strings are escaped. Can a malicious task name break out of the script string? (e.g. `"; deleteObject(flattenedTasks[0]); "`)
- [ ] `formatValue()` — what types does it handle? Does it JSON.stringify strings? Are there edge cases (backticks, template literals, unicode)?
- [ ] Review every `{{param}}` template substitution for injection risk

### Secrets and credentials
- [ ] `.gitignore` — verify `.env`, `credentials/`, logs, and any local config are excluded
- [ ] Check git history for accidentally committed secrets (API keys, paths with usernames)
- [ ] `claude-desktop-config.example.json` — ensure it's actually an example, no real paths

### Permissions and access
- [ ] `docs/PERMISSIONS.md` — review, ensure it accurately describes what the server can do
- [ ] The server runs `osascript` — document that this means it has whatever permissions the host user has
- [ ] No network access (confirm — does the server make any outbound requests?)

### Dependencies
- [ ] `npm audit` — check for known vulnerabilities
- [ ] Review dependency tree — are all deps necessary? Any with known issues?

---

## Pass 3: Documentation

**Goal:** Two audiences — public (GitHub) and internal (personal-os).

### 3a: Public docs (omnifocus-mcp repo)

- [ ] **README.md** — full rewrite
  - What it is (MCP server for OmniFocus via Omni Automation)
  - Installation (npm, Claude Desktop config)
  - Full tool reference (41 tools, grouped by domain)
  - Architecture overview (evaluateJavascript bridge, caching, script templates)
  - Known limitations (no location-based tags, file:// only for attachments, MCP restart required for rebuilds)
  - Contributing guidelines
- [ ] **CLAUDE.md** — rewrite for accuracy post-migration
- [ ] **CHANGELOG.md** — add migration entry
- [ ] **LICENSE** — verify appropriate for public release
- [ ] Clean up or remove: `docs/`, `planning/`, `SESSION-NOTES.md`, debug files

### 3b: Internal docs (personal-os-context vault)

- [ ] **Context doc: `context/omnifocus-mcp.md`** (or similar) in Obsidian vault
  - What it does in practice (conversational task management)
  - Capabilities: full CRUD on tasks/projects/folders/tags, subtask hierarchies, notifications, analytics, bulk export
  - Limitations and workarounds:
    - No location-based tags (set manually in OF UI)
    - `add_linked_file` only accepts `file://` URLs
    - MCP server caches old builds until Claude Code restarts
    - Tag creation now supports nesting via `parentTag` param
    - No OF review/perspective management
    - No recurring task creation (can read but not create repeat rules)
  - How agent sessions should use it (unpack → route to OF, weekly review pulls from OF, etc.)
  - Relationship to personal-os prompts (unpack.md, weekly-review.md reference OF)

---

## Sequencing

1. **Hygiene first** — cleans up the mess so security and docs aren't auditing dead code
2. **Security second** — once the code is clean, audit what's actually there
3. **Docs last** — write about the final, clean, secure state

Each pass can be done in a single session. Start any session with:
```
continue from ROADMAP.md in omnifocus-mcp — pick up [pass name]
```

---

*Last updated: 2026-01-31*
