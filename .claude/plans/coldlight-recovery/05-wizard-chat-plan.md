# 05 — Wizard render + chat window + remaining binding work (FULL plan)

> 2026-07-12. Companion to 04-connection-audit-plan.md (approved). Operator rulings
> encoded: wizard identity = BLUE shell + purple body + teal wells; the animated
> MP4 backdrop STAYS and gets format-optimized (the May "no blue/no MP4" note was
> WRONG — corrected in memory). Every slice: ≤5 content files, verified
> (svelte-check + no-raw-values + targeted checks), one commit each, operator's
> eyes for render-affecting outcomes.

## Landed (this session, committed + pushed)

- **W0** `1fb6e096` — wizard surface lightness ladder (root cause of the black
  wizard: all layers authored at L0.10–0.115 over an L~0.08 void; chain was
  healthy, values were black-on-black). Identity unchanged. Also carries the 04
  B8 amendment (commitlint length hiccup — noted, not amended).
- **P3 partial batch A** `d2529eea` — reviewed role rebinds from the halted sweep
  (24 files; teal/blue-as-default → primary role; fallbacks preserved).

## W1 — chat window resolution (operator standing complaint: "chat-tiny")

1. W1.a (read-only, ~10 min): locate the chat WebviewWindow creation (Rust,
   `WebviewWindow`/`window.rs`/tauri.conf), record current size/scale/constraints
   logic + the cqi container seam in the chat shell; produce exact-file findings.
2. W1.b (fix slice, on paper first, operator-approved): correct initial size /
   min-size / DPI scale handling so the chat window opens at a usable resolution;
   verify with run-dev + operator eyes. Files: window creation site + chat shell
   container CSS if the cqi clamp participates.

## W2 — animated backdrop format optimization (operator's actual May ask)

1. Transcode `static/imgs/backgrounds/bganimation_loop.mp4` → WebM (AV1, or VP9
   fallback) — same visual, fraction of the bytes; keep dimensions.
2. Update the `<video>` source in SetupWizardOverlay (+ `<source>` order webm→mp4
   or drop mp4 entirely — pre-release, no backcompat: drop it).
3. Verify: asset loads in run-dev, size delta recorded, operator eyes.
   (Requires ffmpeg on PATH; if absent, slice reports and waits.)

## P3 remainder (binding map buckets not yet executed — planned, NOT run)

- P3-D store identity locals (Surrealdb/Duckdb/Libsql hero+devtool pairs,
  HealthSignal live-bug keyword fallbacks, StoreHeroCard/Poster/Pulse defaults).
- P3-E reasoning/provider identity locals (SwapDialog/RrdDevtool reasoning-accent,
  ClaudeDevtool provider-accent, VisionDevtool, SlotsDevtool via slot-accent,
  CommunityFeedList feed-accent, Knowledge* strip, DevPulseDashboard loop,
  anatomy defaults).
- P3-F namespace renames (accent-section→section-accent, accent-tile→tile-accent,
  accent-service→service-accent + ~9 consumers, LiveActivityPulse --accent→
  --pulse-accent, Stat default teal→primary) — ATOMIC per rename, zero-residual
  grep proof.
- Each bucket = its own slice file authored before execution; Sonnet executes,
  Fable reviews, one commit each.

## Then: 04's connection slices (already approved)

C1 wizard dead-end → C2 stale-Connecting fix → CV checkpoint → C3 https
discovery → C4 real ConnectionMode → C5 dead code → C6 copy SSOT → B8 cortex
purge series (names from kernel_terms SSOT; the "Cortex · embedded" badge lie
dies here).

## Verification law (every slice)

svelte-check 0/0 · no-raw-values exit 0 · targeted cargo check for Rust slices ·
audit:cssvars no NEW undefined · render-affecting slices end at the operator's
eyes in run-dev. No --no-verify, no suppressions, no unreviewed agent output
committed, no execution without this plan's next slice being named to the
operator first.

APPROVED BY OPERATOR: ____________ (W0 + batch A already landed; W1.a is
read-only and starts on "go"; everything else waits for this line or an explicit
per-slice go.)
