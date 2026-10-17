---
paths:
  - "systems/engine/**/*.rs"
  - "kernel/clyffy/**/*.rs"
  - "lab/**/*.rs"
---

# Rust Rules

- Run `cargo clippy -p <crate>` before considering any Rust task complete
- Handle errors with `thiserror` for library code, `anyhow` for application code
- Prefer `&str` over `String` in function parameters where possible
- NEVER use `unwrap()` in production — use `?` or explicit error handling
- NEVER suggest Python equivalents. This is a full-Rust stack. No exceptions.
- Candle inference is SYNC — bridge to async via flume channels, not tokio::spawn_blockin
- All deps forked under EonsofStupid org as git= deps. No submodules. No upstream crates.io.
- rkyv 0.8.15 is PINNED (RUSTSEC-2026-0001). Internal MCP boundary only.
- DuckDB and FFmpeg are accepted C dependencies via FFI.
- Compile before testing. ALWAYS `cargo check -p <crate>` before `cargo test -p <crate>`.