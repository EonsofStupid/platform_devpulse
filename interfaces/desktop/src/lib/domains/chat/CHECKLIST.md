# domains/chat — CHECKLIST

## Architecture

- [ ] `util/` has **zero** imports from `data-access/`, `feature/`, or `ui/`.
- [ ] `data-access/chat.service.ts` is the **only** `@tauri-apps/api` touchpoint.
- [ ] `ui/` components never import `data-access/` or `feature/`.
- [ ] Outside the domain, consumers import **only** from `domains/chat/index.ts`.

## Persistence

- [ ] `send_message` writes to **`turns`** with `project_id` + `session_id` + `sequence_num`.
- [ ] `load_recent` orders by **`sequence_num`**, not ad-hoc `created_at` ordering.
- [ ] `delete_session` / `clear_all_chat_history` respect cascade rules in engine schema.

## Visual / ColdLight

- [ ] New visuals use **`renderForge`** + `cssVarString` — no hand-rolled component `<style>` blocks.
- [ ] Chat presets live in `src/lib/design/visual/presets/chat.ts` and flow through `style-presets.json`.
- [ ] No infinite `cl-breathe` on panels — only `TypingIndicator` (+ approved primitives).

## Verification

- [ ] `pnpm check` (desktop) — zero diagnostics.
- [ ] `cargo check -p devpulse_desktop_backend` — clean on touched Rust.
- [ ] `cargo check -p devpulse-engine` after engine public exports change.
