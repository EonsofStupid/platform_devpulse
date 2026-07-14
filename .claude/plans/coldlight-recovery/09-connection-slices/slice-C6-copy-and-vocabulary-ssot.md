# C6 — copy + vocabulary → SSOT: collab view + the three indicators

## GOAL

Kill B7's remainder: `ClyffyCollabView`'s all-English body and the three
no-AI indicator labels ("AI: Clyffy" / "Standalone" at StatusBar/TopBar/chat
Frame) move into the engine copy SSOT — zero hardcoded English at these
seams. (The wizard step-2 literals already died in 08/R5.)

## PRECONDITIONS

1. 08/R2 DONE (its struct+TOML+regen pattern is the template — re-read that
   slice's landed diff first: `git log --oneline --all -- systems/devpulse-engine/src/platform/wizard/copy.rs | head -3`).
2. Census (separate greps, record all):
   - `grep -rn "AI: Clyffy\|Standalone" interfaces/desktop/src/lib/ --include="*.svelte" -l`
     (expected: StatusBar, TopBar, chat Frame — 04 cites :127/:129/:66; the
     live lines may have drifted — the grep is the truth)
   - Read `ClyffyCollabView.svelte` IN FULL; list every English literal.
   - `grep -rn "clyffy.local" interfaces/desktop/src/lib/ --include="*.svelte"`
     — customer-visible hits outside `url_placeholder` (the placeholder is a
     config-EXAMPLE and stays).

## FILES

1. `systems/devpulse-engine/src/platform/wizard/copy.rs` — `CollabCopy` +
   `IndicatorsCopy` structs + `WizardCopy` fields (same file owns all copy
   structs today; the file's name outgrowing "wizard" is NAMED DEBT for a
   later rename slice, not this one).
2. `systems/devpulse-engine/config/wizard_copy.default.toml` — `[collab]` +
   `[indicators]` tables.
3. `…/setup-wizard/feature/views/ClyffyCollabView.svelte` — consume copy.
4. The three indicator consumers (paths from the census — StatusBar, TopBar,
   chat Frame) — consume `[indicators]`. If that makes FIVE files total,
   the indicator consumers split into their own commit (C6.b) — ≤5 per
   slice-commit holds.

## STEPS

1. Author `[collab]` keys from the census's literal list (layman voice,
   verbatim values written at execution INTO the plan report — the executor
   drafts them from the existing literals, the reviewer checks voice), plus
   tooltips for its interactive elements (per the 08 tooltip law).
2. Author `[indicators]`, exact keys:

```toml
[indicators]
connected_label = "AI: Clyffy"
standalone_label = "Standalone"
connected_tooltip = "Your Clyffy is connected — the AI features are live."
standalone_tooltip = "Running standalone — connect a Clyffy anytime to light up the AI features."
```

   (Consumers that already show richer status text keep their live-state
   binding; only the LITERALS rebind.)
3. Structs mirror the 08/R2 pattern exactly; `cargo check -p devpulse-engine`
   → regen bindings → consumers rebind (`copy` reaches indicator components
   however the census shows they get props today — if an indicator has no
   copy-loading path, it receives the two labels as typed props from its
   nearest copy-holding parent; NO new global store).
4. `pnpm check` 0/0 · `no-raw-values` 0 · post-grep: the census greps → ZERO
   English hits at the touched seams.
5. Commit(s) + push: `feat(engine): collab + indicator copy → SSOT (C6/B7)`
   (+ `…C6.b` if split).

## IMPORT REPOINTS

Whatever the census enumerates — every consumer listed with file:line in
the report.

## VERIFY

Step 4 · diff ⊆ FILES (per commit).

## KNOWN REDS

Baseline only.

## ROLLBACK

`git checkout -- <files>` + regen bindings.

## STOP CONDITIONS

- An indicator's label turns out to be computed (not a literal) → leave it;
  report.
- Copy-plumbing to an indicator would need a new architectural seam (global
  copy store) → STOP, propose, wait.
