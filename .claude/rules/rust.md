---
paths:
  - "kernel/**/*.rs"
  - "systems/**/*.rs"
  - "interfaces/desktop/src-tauri/**/*.rs"
  - "xtask/**/*.rs"
---

# Rust Rules

- Run `cargo clippy -p <crate>` before considering any Rust task complete
- Handle errors with `thiserror` for library code, `anyhow` for application code
- Prefer `&str` over `String` in function parameters where possible
- NEVER use `unwrap()` in production — use `?` or explicit error handling
- Rust is the default language. Python is allowed but not the default; it is the obvious choice for ML training, fine-tuning and data pipelines — see Language Choice in CLAUDE.md (owner, 2026-09-23 `1921fc48`; again 2026-10-24: "Python is allowed").
- Runtimes (AI inference, the Surreal server) run as built binaries in supervised subprocesses, never compiled in (plan 0007; owner 2026-10-09 and 2026-10-24: "we properly use built binaries and have them as subprocesses").
- External builds live in sub repos (git submodules) of platform_devpulse; dependencies stay on their latest stable release (owner 2026-10-09, 2026-10-12).
- rkyv 0.8.15 is PINNED (RUSTSEC-2026-0001). Internal MCP boundary only.
- DuckDB and FFmpeg are accepted C dependencies via FFI.
- Compile before testing. ALWAYS `cargo check -p <crate>` before `cargo test -p <crate>`.
