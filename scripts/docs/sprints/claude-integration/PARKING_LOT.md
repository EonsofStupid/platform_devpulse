# Parking Lot — Claude Integration Sprint

## [2026-04-06T19:30] Blocker: Rushing MCP tools without understanding Platform API

**Sprint**: Claude Integration Sprint 3 (Tool Registry)
**Task**: Build 5 real MCP tools that exercise Platform services
**Status**: AWAITING_RESOLUTION

### Context
I wrote 5 tool files (get_health, query_libsql, repo_get_file, repo_list_files, shell_execute) with unused imports in every single one. The compiler caught:
- `unused import: Value` (4 files)
- `unused import: std::sync::Arc` (4 files)  
- `unused import: crate::platform::Platform` (3 files)
- `unused import: json` (1 file)
- `unused imports: HeaderValue and get` (1 file — transport_sse)
- `SqlValue: serde::Serialize not satisfied` (query_libsql — fundamental type mismatch)

### The Problem
I was writing tool handlers as closures that receive `Arc<Platform>` and `Value`, but:
1. The closure signature `Fn(Arc<Platform>, Value)` means `Arc` and `Value` are used by the TYPE SYSTEM, not by the module's imports — the handler Box type in `mod.rs` handles this
2. Each tool file imports `Arc`, `Value`, `Platform` at module level but they're only referenced inside the `Box::new(|platform, args|` closure — Rust sees the outer scope imports as unused
3. `SqlValue` doesn't derive `Serialize` — I can't just `serde_json::to_string_pretty` the query results
4. I didn't read the actual Platform API before writing tools
5. I didn't read the actual types (`SqlValue`, `SqlRow`, `SystemHealth`) before assuming they're serializable

### Root Cause
**I am pattern-matching instead of understanding.** I'm copying the Tauri command pattern without verifying that:
- The types I'm importing are the ones I need
- The types I'm serializing implement the traits I need
- The closures I'm writing actually reference their captured variables correctly

### What I Need To Do Before Writing Another Line

1. **Read every Platform public method** — understand return types, error types, lifetime requirements
2. **Read SqlValue, SqlRow, SqlAdapter** — understand what `query()` actually returns and how to convert it to JSON
3. **Read SystemHealth** — verify it derives Serialize (it likely does since it's specta::Type)
4. **Understand Rust closure capture** — the tool handler type `Fn(Arc<Platform>, Value) -> Pin<Box<dyn Future>>` means the closure PARAMETERS provide Arc<Platform> and Value. Module-level imports of these types are only needed if used OUTSIDE the closure.
5. **Research MCP tool implementations** — what do real 2026 MCP servers look like? What's the rmcp crate doing? What patterns do production servers use?
6. **Fix the handler architecture** — the `ToolHandler` type should handle the typing. Tool files should only import what THEY specifically use beyond what the handler signature provides.

### Options
1. **Reauthor all 5 tools from scratch** after doing the research above
2. **Fix the existing tools** one at a time with proper understanding
3. **Research first, then reauthor** — spend time reading before writing

### Decision
PROCEEDING WITH OPTION 3: Research first, then reauthor everything correctly.

---
