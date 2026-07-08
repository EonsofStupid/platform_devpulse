# DevPulse Platform Specification — Layman Baseline

**The official pre-release baseline** for what non-technical users experience in
DevPulse. This document is normative for user-facing behavior; it deliberately
contains **zero hardcoded model names, sizes, tiers, or endpoints** — every
concrete value a user sees is *computed at runtime* (hardware probe, capability
handshake, config SSOT) and would be a lie if written down here.

> **Document status.** Version 2.0.0, reauthored 2026-07-08 for the kernel
> severance + standalone-first architecture. Supersedes v1.0 (2026-04-07),
> which described a pre-severance world: bundled models, hardcoded
> VRAM-tier→model tables, and local-only inference. That framing is dead —
> do not restore it. History lives in git.

---

## Core Philosophy

| Principle | What It Means |
|-----------|---------------|
| **Loads standalone** | DevPulse opens and works with no AI backend reachable. Standalone is a *mode*, never an error. |
| **AI is a connection** | The AI layer is headless Clyffy on a machine the user controls — this PC, a box on their network, or their GB10 over their private mesh. |
| **Computed, never hardcoded** | What the AI can do is read live from the connected endpoint's capability handshake. No fabricated slot tables, no shipped endpoints, no model defaults in code or docs. |
| **Progressive disclosure** | Power users can inspect everything (devtools); beginners never need to. |
| **Local-first** | Data lives on machines the user controls — this PC (Turso + DuckDB) and their own Clyffy host. Nothing goes to a third party. |
| **Layman language** | Every visible string comes from the copy SSOT (`wizard_copy` TOML, user-overridable). No jargon reaches the customer. |

---

## 1. The Two Tiers

### Tier 1 — Standalone (always available)

DevPulse boots by itself: the full shell, projects, local stats, and local
model *management*. No GPU, no AI backend, no network required.

What Tier 1 includes:

- The app shell (topbar / sidebar / content / context / statusbar) and every
  non-AI surface
- Project data in the local store (Turso — the local source of truth;
  DuckDB for project analytics)
- **Local model management** — browse, download, catalog, and organize model
  files (the Model Downloader + Slot Orchestrator devtool). Management is
  DevPulse's job; *running* models is the AI layer's job.
- Honest, subtle **no-AI indicators** on three surfaces: the status bar
  (`AI: Standalone`), the top bar, and the chat window. They present a mode,
  not a failure.

### Tier 2 — Connected (additive)

When the user connects a Clyffy endpoint, the AI features light up — chat,
helpers, voice, vision, retrieval — **exactly as advertised by that
endpoint**, nothing more, nothing less.

- The handshake reads the endpoint's live capability (its kind, version,
  build, and the slots it currently serves).
- Every AI surface derives from that answer. If the endpoint serves no voice,
  no voice UI pretends otherwise.
- If the connection drops, DevPulse returns to Tier 1 and quietly keeps
  retrying — reconnection is seamless and automatic, no restart, no error
  wall.

---

## 2. Connecting the AI Layer

### First run

1. DevPulse loads standalone (Tier 1) — the user sees a working app first.
2. The setup wizard offers the **connect step**: link the AI now, or skip.
3. Two modes are presented (both are just an address — the mode cards are
   layman guidance, not different protocols):
   - **This machine / home network** — Clyffy running locally or on a box on
     the same LAN.
   - **GB10** — the user's box reached over *their* private mesh; the address
     is pasted in manually (link-local discovery cannot cross a mesh, so this
     stays explicit by design).
4. **Connect** dials the entered address and the UI shows the honest live
   status: connecting → connected (capability received) → or "couldn't reach
   it, retrying in the background."
5. **Skip is a first-class choice.** The app stays standalone; the no-AI
   indicator remains; the user can connect any time later from the same
   surfaces.

Rules that hold everywhere:

- **The endpoint address is never shipped, guessed, or hardcoded.** It is
  typed by the user (or discovered locally, when discovery lands — a deferred
  feature, not a removed one).
- The wizard's strings come from the copy SSOT; the only address-shaped text
  anywhere is an *editable example placeholder* in that user-overridable
  config.

### After first run

- The chosen endpoint persists across restarts (pending slice: endpoint
  persistence + "decided" flag — see §9).
- Re-entry points: the status-bar AI badge area and the connect step of the
  wizard, re-openable on demand.

---

## 3. Capabilities — The User Mental Model

Users don't think in "models." They think in **what Clyffy can do**. DevPulse
presents capabilities in two layman surfaces, both computed from the same
live handshake:

### The five senses (setup wizard cortex view)

Five anatomy tiles — Brain, Sparkles (indexing), Eyes, Ears, Mouth — each
lights up when the connected endpoint advertises the matching capability:

| Anatomy | What the user is told | Lights up from |
|---------|----------------------|----------------|
| Brain | the long-think reasoner | the endpoint's main reasoning slot |
| Sparkles | the indexing brain | the retrieval/embedding slot |
| Eyes | what Clyffy sees | any advertised vision capability |
| Ears | what Clyffy hears | the voice slot |
| Mouth | how Clyffy speaks | the voice slot |

The tile shows the *advertised* model's friendly name and status
(Connect / Connecting… / Live / Retry). A tile that isn't served shows its
honest "awaiting backend" framing. **No default model column exists** —
what's served is the Clyffy host's configuration, not DevPulse's opinion.

### The capability browser (chat surface)

A grouped catalog (Thinking / Memory / Voice / Vision / Tools) whose
availability is a pure function of the advertised slots. Standalone shows
every entry as "Not yet available" — honestly.

---

## 4. Local Model Management (Tier 1, DevPulse-owned)

DevPulse manages model *files*; it does not run them.

- **Browse & download** — the Model Downloader overlay searches the model
  hub, tags a file with its intended role, verifies integrity, and registers
  it in the local catalog. Downloads show progress / pause / resume / speed /
  ETA with layman copy.
- **Organize** — the Slot Orchestrator devtool assigns catalog entries to
  roles, clears assignments, and points at local files.
- **Recommendations are computed** — the hardware probe (GPU, VRAM, RAM)
  drives a tier *badge* and sizing guidance at runtime. The tier names,
  thresholds, and any model suggestions come from runtime config
  (tier-adaptive presets), never from this spec. Writing a VRAM→model table
  here would hardcode a decision the probe + preset config own.

---

## 5. Language & Copy Baseline

- **Every visible string** flows from the Rust copy SSOT
  (`wizard_copy.default.toml`, embedded; user override at
  `{data_dir}/config/wizard_copy.toml`). Views receive typed copy structs and
  render them — zero hardcoded English in Layer-2 views.
- **Layman vocabulary is the product surface.** "AI brain," "what Clyffy
  sees" — never "inference endpoint," "embedder," or quant levels. The
  terminology SSOT drives the rename consistently.

Users never see: model formats (GGUF/ONNX/SafeTensors), quantization labels,
backend names, VRAM allocation internals, or wire-protocol details.

Users always see: capability names in plain language, simple status cues
(Live / Connecting… / Standalone / Retry), actionable buttons, and friendly
error messages with a next step.

---

## 6. Look & Feel Baseline (ColdLight)

The visual baseline every user-facing surface conforms to:

- **OKLCH color end-to-end** — perceptually uniform; tinted surfaces are
  hue-rotations at matched lightness/chroma (teal, purple, blue, ember,
  coral glass fills), so variety stays coherent.
- **REM units + fluid sizing** — dimensions are `clamp()` scales; component
  and inset scales interpolate on **container size** (`cqi`), so panels,
  overlays, and the separate chat window truly rescale with their own
  container, not just the OS window.
- **Blue CTAs** (locked) — the call-to-action role is bound to brand blue;
  `cta` is a stable alias of `primary`.
- **Animated MP4 backdrop** (locked) on the setup wizard; 4-tier depth
  stacking (backdrop → glass → stark → matte) for every overlay.
- **Clyffy mascot** (locked) — the mascot illustration, never a generic
  brain icon.
- ColdLight owns ARIA; views compose primitives and never hand-author
  visual CSS a preset covers.

---

## 7. Error States & Recovery

| Situation | User sees |
|-----------|-----------|
| Endpoint unreachable | "Couldn't reach it. Check the address and that Clyffy is running — I'll keep trying in the background." (probe keeps retrying; app stays usable in Tier 1) |
| Connection drops mid-session | AI surfaces return to their standalone framing; the three no-AI indicators reappear; auto-reconnect continues silently |
| A served slot fails | The tile/status shows the endpoint's own failure message (the wire carries it) with a Retry cue |
| Download interrupted | "Download paused. Resume when connected." |
| Damaged model file | "This model file is damaged." with a re-download action |

The principle: errors are **states the wire or the local operation actually
reported**, translated to layman copy — never fabricated, never a dead end.

---

## 8. What Runs Where

| Concern | Where | Why |
|---------|-------|-----|
| UI shell, projects, settings | DevPulse (this PC) | the product surface |
| Local store (source of truth) | DevPulse — Turso | standalone must work offline |
| Project analytics | DevPulse — DuckDB | local, per-project |
| Model file management (download/catalog/assign) | DevPulse | management is local; files are the user's |
| Hardware probe + tier badge | DevPulse | drives display + sizing guidance |
| **Inference** (chat, embeddings, rerank, voice, vision) | **Clyffy host** (local box or GB10) | the AI layer is a connection |
| Slot loading/unloading, model runtime | Clyffy host | advertised via capability, displayed by DevPulse |
| Deep AI analytics / memory | Clyffy host | DevPulse renders what it's served |

Hardware expectations follow from this split: **DevPulse itself is a
lightweight desktop app** (no GPU required for Tier 1). AI capability is the
*Clyffy host's* hardware story, and the architecture is size-agnostic — the
same UI renders whatever the endpoint advertises, from a modest single-GPU
box upward. Minimum/recommended numbers are runtime-probe and host-config
concerns, not spec constants.

### The data folder — smart-portable, generated by DevPulse

DevPulse generates and owns its data folder the way an installed app owns
its AppData — but **beside the exe first**, so a portable extract is fully
self-contained:

1. **Portable / writable location** — `.userdata/` lives next to the exe.
   The portable zip ships the skeleton; if the user deletes it, the app
   recreates it on launch (a write-probe proves the location is writable).
   Moving the folder with the app moves the whole setup.
2. **Installed to a protected location** (e.g. Program Files) — the write
   probe fails and data goes to the standard OS app-data dir instead.
3. **Dev tree** — the repo-root `.userdata/` (auto-created in dev builds).

Everything the app generates at runtime lives under this one root; each
subsystem owns its subfolder (`user/` for operator state as atomic TOML,
`config/` for user overrides of shipped config, `logs/`, and the local
data stores). No runtime write escapes the root — the one deliberate
exception is integrations that register DevPulse with *external* tools
(e.g. adding an MCP entry to Claude Code's own config), which by
definition write where that tool reads.

Performance note: the folder's *location* is I/O-neutral (same disk =
same speed; the databases hold their files open either way). Portability
costs nothing — what matters is the medium the bundle sits on, which is
the user's choice.

---

## 9. Pre-Release Baseline Checklist

What this baseline **guarantees today** (verified in code):

- [x] Loads standalone; no AI required (Tier 1)
- [x] Three-surface no-AI indicator (status bar, top bar, chat window), all
      reading the one connection source
- [x] Connect step in the wizard: Local / GB10 modes, manual address, real
      connect command, live status; Skip is first-class
- [x] Runtime re-pointing — connect/disconnect without restart (probe loop
      re-reads the endpoint)
- [x] Capability-computed surfaces: cortex tiles + capability browser +
      endpoint-metadata chip all derive from the live handshake
- [x] Copy SSOT for the connect flow (`[connect]` table, user-overridable)
- [x] ColdLight baseline: OKLCH, REM, container-fluid (cqi) sizing, blue
      CTA role, tinted glass families, MP4 wizard backdrop

Deferred — **not retired** (each has a named owner slice):

- [ ] Endpoint persistence across restarts + "setup decided" flag
      (B1-persist)
- [ ] Boot gate keyed to the connect decision instead of local model
      assignment (B7)
- [ ] Local (LAN) endpoint discovery; GB10 stays manual by design (B8)
- [ ] Voice/vision end-to-end over the wire (needs the Clyffy daemon live)

Runtime verification note: the *connected* path cannot be end-to-end
verified until a Clyffy daemon is reachable; the standalone path and the
disconnected behavior of every surface above are verifiable now.

---

*Document version: 2.0.0 — official pre-release baseline*
*Reauthored: 2026-07-08 (kernel severance + standalone-first)*
*Owner: DevPulse Platform Team*
