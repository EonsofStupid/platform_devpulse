# Persona memory service

Restored from the original persona MCP service into its kernel owner. The
workspace builds the library and the `devpulse-persona-mcp` executable.
Provenance is recorded in `recovered/repo/SOURCES.tsv`; plan 0009 owns restoration
and plan 0001 B6 owns attachment to agent sessions.

The service exposes four MCP tools: `persona.load`, `persona.save`,
`persona.list`, and `persona.recall`. User and project memory live in the
`persona_blocks` table. Writes and their retry results in `persona_idempotency`
commit together; retries survive process restarts. Block limits count Unicode
characters and respect the limit stored on each block.

The parent process supplies `DEVPULSE_PERSONA_DB`, an absolute Turso database
path within its configured data location. There is no implicit database under
the operating system's application-data directory. `CLYFFY_OFFLINE=true` enables
local stdio operation. Without it, the preserved authentication gate rejects
tool execution; remote authentication is not implemented by this executable.

Inside DevPulse the store has one owner, because Turso lets one process hold a
database: the engine keeps these tables in the user database and runs a `Bridge`
on a private local pipe. Each agent session starts this binary with
`DEVPULSE_MEMORY_PIPE` and `DEVPULSE_MEMORY_TOKEN`, and it only relays its stdio
to the owner. The token decides what the session reaches: your own blocks and
its project's to read, its project's to write. A caller's arguments never widen
that. Plan 0001 B6.2 has the reasons.

MCP messages use newline-delimited JSON on stdin/stdout. Logs go to stderr.
Initialize the session, send `notifications/initialized`, then call tools.
Closing stdin terminates the service. Successes expose both text content and
structured content; tool execution failures carry `isError: true`.

`persona.recall` defaults to `text`, preserving the original label/body search.
Cosine, BM25 and graph modes require configured retrieval backends. They return
explicit errors instead of substituting text matching and claiming vector scores.

```powershell
cargo test -p devpulse-persona-mcp --tests
cargo clippy -p devpulse-persona-mcp --all-targets -- -D warnings
```

The tests include the real subprocess handshake, persistence across restart,
concurrent writes/retries, rollback, scope filtering and character limits.
Desktop bundling, session attachment and the supervised-memory UI remain
integration work; this crate's presence does not establish those product flows.
