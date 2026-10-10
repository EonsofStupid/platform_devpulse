# R2 — copy SSOT: every key the recode consumes, verbatim

## GOAL

Add EVERY string the recoded wizard renders — mode tooltips, scan rung labels
+ tooltips, live probe lines, capability-confirm view copy, tile tooltips —
to the Rust copy SSOT, layman Teaching-Mode voice, so no later slice ever
types English in a view.

## PRECONDITIONS

1. R1 committed; `git status --porcelain` clean.
2. Probe: `grep -n "struct ConnectCopy" systems/devpulse-engine/src/platform/wizard/copy.rs`
   → expected one hit near line 863.
3. Probe: `grep -n "^\[connect\]" systems/devpulse-engine/config/wizard_copy.default.toml`
   → expected one hit near line 460, keys through `manual_reveal` (~line 489).
4. Probe how defaults load: `grep -n "wizard_copy" systems/devpulse-engine/src/platform/wizard/copy.rs | head -20`
   and read the loading fn in full. Note whether fields deserialize from the
   default TOML only, or merge a user file. If a user-override file can lack
   new keys AND fields are non-`Option` with no `#[serde(default)]` → mirror
   whatever pattern the EXISTING sections use for additions (read how
   `discover_cta` etc. were added — same file, same struct). Do not invent a
   defaulting strategy; copy the existing one exactly.

## FILES

1. `systems/devpulse-engine/src/platform/wizard/copy.rs` — extend
   `ConnectCopy`; add `CapabilityCopy` struct + `capability` field on
   `WizardCopy` (mirror ConnectCopy's doc-comment style verbatim).
2. `systems/devpulse-engine/config/wizard_copy.default.toml` — the values
   below, verbatim.
3. `interfaces/desktop/src/lib/sys/generated/bindings.ts` — regenerated.

## STEPS

1. Read `copy.rs` in full (chunked — >500 LOC). Find `ConnectCopy` and
   `WizardCopy`; find where `[connect]` maps.
2. Extend `ConnectCopy` with these fields (all `pub … : String`, one
   doc-comment each, grouped with section comments like the existing file):
   third mode card — `mode_network_label`, `mode_network_hint`;
   tooltips — `mode_local_tooltip`, `mode_network_tooltip`,
   `mode_gb10_tooltip`, `discover_tooltip`,
   `manual_tooltip`, `skip_tooltip`, `continue_tooltip`, `back_tooltip`,
   `confirm_tooltip`, `url_tooltip`;
   scan surface — `scan_title`, `scan_subtitle`, `scan_rung_persisted`,
   `scan_rung_configured`, `scan_rung_localhost`, `scan_rung_mdns`,
   `scan_rung_mesh`, `scan_rung_persisted_tip`, `scan_rung_configured_tip`,
   `scan_rung_localhost_tip`, `scan_rung_mdns_tip`, `scan_rung_mesh_tip`,
   `scan_rung_waiting`, `scan_rung_done_none`, `scan_rung_done_some`,
   `scan_rung_not_run`, `scan_rung_not_run_tip`, `scan_probe_trying`,
   `scan_probe_answered`, `scan_probe_silent`, `scan_finished_some`,
   `scan_finished_none`, `scan_error`.
3. Add `CapabilityCopy` struct (fields below) + `pub capability:
   CapabilityCopy` on `WizardCopy`, mapped to a new `[capability]` TOML table
   — mirror exactly how `connect` is declared/loaded.
4. Append to `[connect]` in `wizard_copy.default.toml`, verbatim:

```toml
# ── Third mode card (charter: local / network / gb10 — C4 wires the
#    real ConnectionMode; the copy lands NOW so C4 never touches copy) ──
mode_network_label = "Another machine on my network"
mode_network_hint = "Clyffy runs on a different computer in your home or office."

# ── Tooltips (mouseover, layman verbatim) ────────────────────────
mode_local_tooltip = "Pick this if Clyffy runs right here on this computer — the search checks this machine first."
mode_network_tooltip = "Pick this if Clyffy runs on another machine in your home or office — the search asks your network (mDNS) and your mesh."
mode_gb10_tooltip = "Pick this if you have a GB10 box on your private mesh (Tailscale or Headscale). The search checks your mesh and your config."
discover_tooltip = "Searches five places in order: your saved endpoint, your config file, this machine, your home network, and your private mesh. Everything you see really happened."
manual_tooltip = "Already know the address? Type it in yourself — like http://clyffy.local:8080."
skip_tooltip = "DevPulse keeps working without AI. The badge in the corner brings you back here whenever you're ready."
continue_tooltip = "Go to the next step — you can always connect later."
back_tooltip = "Return to the previous step. Nothing you did here is lost."
confirm_tooltip = "Connect to this Clyffy. You can switch to a different one anytime."
url_tooltip = "The web address where your Clyffy answers. Ask whoever set it up, or check the machine it runs on."

# ── Live scan surface (renders ONLY what the signals prove) ──────
scan_title = "Searching for your Clyffy"
scan_subtitle = "Watching every place it could be — live, as it happens."
scan_rung_persisted = "Your saved endpoint"
scan_rung_configured = "Your config file"
scan_rung_localhost = "This machine"
scan_rung_mdns = "Your home network"
scan_rung_mesh = "Your private mesh"
scan_rung_persisted_tip = "The last Clyffy you connected to — it gets checked first."
scan_rung_configured_tip = "An address written in your DevPulse settings file, if you have one."
scan_rung_localhost_tip = "Checks whether Clyffy is running right here on this computer."
scan_rung_mdns_tip = "Asks the devices on your home or office network to answer (that's mDNS)."
scan_rung_mesh_tip = "Checks the machines on your private mesh — Tailscale or Headscale."
scan_rung_waiting = "Waiting…"
scan_rung_done_none = "Nothing here"
scan_rung_done_some = "{count} answered"
scan_rung_not_run = "Skipped — nothing to check here yet"
scan_rung_not_run_tip = "This spot only gets searched once there's something to search — for example, a saved endpoint from a previous connection."
scan_probe_trying = "Trying {url}"
scan_probe_answered = "answered"
scan_probe_silent = "no answer"
scan_finished_some = "Done — found {found} ({probed} addresses checked)."
scan_finished_none = "Done — nothing answered ({probed} addresses checked)."
scan_error = "The search hit a snag: {error}"
```

5. Add the new section, verbatim:

```toml
[capability]
title = "Here's what your Clyffy can do"
subtitle = "These senses light up straight from the Clyffy you just connected — nothing on this screen is a guess."
standalone_hint = "Not connected yet — these senses light up the moment you link a Clyffy."
tile_brain_tip = "The deep reasoner — Clyffy's main thinking model."
tile_sparkles_tip = "The indexing helper — reads your project so answers arrive with the right context."
tile_eyes_tip = "Vision — lets Clyffy understand screenshots and images."
tile_ears_tip = "Speech-to-text — Clyffy hears your microphone."
tile_mouth_tip = "Text-to-speech — Clyffy answers out loud."
terms_caption = "What these words mean:"
skip_label = "Set up my AI later"
skip_tooltip = "Finish without connecting — everything here fills in later, live."
continue_label = "Continue"
continue_tooltip = "Finish this step. Everything here updates live as your Clyffy changes."
```

   (`{count}` / `{url}` / `{found}` / `{probed}` / `{error}` are plain
   placeholders — the VIEW substitutes with `.replace()`; the SSOT stays
   template-free logic-wise, matching how existing copy is consumed.)
6. `cargo check -p devpulse-engine` → exit 0, 0 warnings.
7. `cargo xtask regen-bindings` → `ConnectCopy`/`CapabilityCopy` TS types gain
   the fields. Probe: `grep -n "scan_rung_mdns\|CapabilityCopy" interfaces/desktop/src/lib/sys/generated/bindings.ts` → hits.
8. `cd interfaces/desktop && pnpm check` → 0/0.
9. Commit + push: `feat(engine): wizard copy SSOT — scan surface, tooltips, capability step (layman verbatim)`.

## IMPORT REPOINTS

None — additive fields; no view consumes them until R4/R5.

## VERIFY

As steps 6-8, raw output pasted. Plus:
`grep -c "tooltip\|_tip" systems/devpulse-engine/config/wizard_copy.default.toml`
→ count increased by exactly the number of new tooltip keys (14 in
[connect] + 7 in [capability] + scan tips).

## KNOWN REDS

Pre-existing vitest baseline only. `cargo check -p devpulse-engine` must be
clean — any red here is NEW and blocks the slice.

## ROLLBACK

`git checkout -- systems/devpulse-engine/src/platform/wizard/copy.rs systems/devpulse-engine/config/wizard_copy.default.toml`
then `cargo xtask regen-bindings`.

## STOP CONDITIONS

- The copy loading fn uses a pattern the plan didn't anticipate (e.g. required
  user-file keys with no default merge) → STOP, report the actual mechanism.
- `WizardCopy` sections are generated rather than hand-declared → STOP.
- Any step needs a new directory → STOP.
