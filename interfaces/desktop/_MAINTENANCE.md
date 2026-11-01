# Desktop Maintenance Protocol (The World Law)

> **STATUS**: PROTECTED
> **ROLE**: User Interface & Command Dispatch.

## 1. The Strict Law of Visuals
- **Glass First**: All components must adhere to `app_state.glass_tint` logic.
- **No Business Logic**: `src-tauri` commands simply *dispatch* to the Engine/Kernel. They do not calculate.
- **Asset Binding**: Do not hardcode paths. Use `appState` assets.

## 2. The Law of Dependencies
- **Strict Tauri**: Only `tauri`, `serde`, `specta/ts-rs`.
- **No Direct db**: The Frontend NEVER touches SQL. It only emits Signals.

## 3. The Changelog (Active)
- [2026-01-14] Initial Guardrail Enforcement.
