# Kernel Maintenance Protocol (The Blackbox Law)

> **STATUS**: PROTECTED
> **ROLE**: Proprietary IP Guardrails.

## 1. The Strict Law of Duplication
- **Check First**: Before adding *any* type, run `grep -r "TypeName" .`
- **One Truth**: If a type exists in `systems/engine`, it MUST NOT be redefined here. Use imports.
- **Fail Condition**: Any PR/Sprint that adds a duplicate struct will be rejected.

## 2. The Law of Visibility
- **No UI Types**: This crate knows nothing of Svelte, Tauri, or Wry.
- **No Http**: This crate does not make network requests directly (Use Adapters).
- **Unsafe Forbid**: `unsafe_code = "forbid"` is absolute.

## 3. The Changelog (Active)
- [2026-01-14] Initial Guardrail Enforcement.
