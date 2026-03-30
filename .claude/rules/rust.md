---
paths:
  - "systems/engine/**/*.rs"
  - "kernel/clyffy/**/*.rs"
  - "alpha/**/*.rs"
---

# Rust Rules

- Run `cargo clippy` before considering any Rust task complete
- Handle errors with `thiserror` for library code, `anyhow` for application code
- Prefer `&str` over `String` in function parameters where possible
- Never use `unwrap()` in production code — use `?` operator or explicit error handling
