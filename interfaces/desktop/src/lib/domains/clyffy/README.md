# Clyffy domain

Kernel functionality is included in the shipped Tauri application. Simple and
advanced presentation use the same underlying service state. The owner reversed
the old IP-hiding policy on 2026-11-01; see `.claude/rules/ip-protection.md`.

- Simple presentation uses generated, layman-friendly labels.
- Advanced presentation exposes available technical names, prompt/configuration
  detail and diagnostics. It is selected in DevPulse Settings, not by build mode.
- Preserve original identities and data. Labels are presentation copies.
- State and endpoint capability checks control whether operations are ready.
- Keep reusable components in ColdLight and domain UI colocated with its types.

The dashboard consumes `status/clyffy.state.svelte.ts` and the existing tool
browser. Unconnected panels must show unavailable status rather than invented
measurements. Presentation visibility does not complete their service wiring.
