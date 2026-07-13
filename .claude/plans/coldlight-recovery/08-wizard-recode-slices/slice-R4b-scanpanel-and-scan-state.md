# R4b — scan.state + ScanPanel: the live scan surface (NO MOCK)

## GOAL

The cool scanning animation that is ACTUALLY trying to connect. A typed
event-accumulator (`scan.state.svelte.ts`) folds the REAL backend discovery
stream into a render model; `ScanPanel` (colocated variant) pops up on scan
start and renders ONLY what the signals prove: each rung's true status, every
probed URL as it happens, verified endpoints, honest totals. Never a message
unless it is true and it happened.

Component law: as stated in slice-R4a (colocated `ui/`, base blocks only,
preset chains, fluid cqi, zero English, dumb UI).

## PRECONDITIONS

1. R1, R2, R3a DONE. Tree clean.
2. Probe the event vocabulary — read the generated union:
   `grep -n "clyffyDiscoveryProgress" -A 3 interfaces/desktop/src/lib/sys/generated/bindings.ts`
   and locate the `DiscoveryEvent` type. Record the EXACT `kind` literals for
   all four variants (expected camelCase: `sourceScanned`, `candidateProbed`,
   `found`, `finished` — but MATCH THE FILE, never this plan, if they differ)
   and the exact `DiscoverySource` literal spellings (expected:
   `persisted | configured | localhost | mdns | meshPeer` — same rule).
3. Probe which rungs emit `SourceScanned` when they contribute nothing:
   `grep -n "SourceScanned" interfaces/desktop/src-tauri/src/endpoint_discovery.rs`
   and read each emission site. Record per rung: does a rung with zero
   candidates (e.g. no persisted endpoint) STILL emit `SourceScanned
   { candidates: 0 }`, or is it silent? The UI renders "skipped" ONLY for
   rungs that are provably silent at `finished` — absence at stream-complete
   is truth; absence mid-stream is UNKNOWN and renders as waiting.

## FILES

1. `…/setup-wizard/scan.state.svelte.ts` — NEW (beside wizard.state.svelte.ts).
2. `…/setup-wizard/ui/ScanPanel.svelte` — NEW.
3. `…/setup-wizard/feature/views/EndpointView.svelte` — wire the accumulator
   + mount the panel; delete the old found-only listener + `discovery` local.
4. `…/setup-wizard/util/wizard.types.ts` — `ScanPanelProps`.

## STEPS

1. Author `scan.state.svelte.ts` — a class rune, NAV-FREE, mirroring
   wizard.state.svelte.ts's style. Exact contract:

```ts
/** Ladder order is the BACKEND's ladder order — render rows in this order. */
export const RUNG_ORDER = ["persisted", "configured", "localhost", "mdns", "meshPeer"] as const;
export type RungId = (typeof RUNG_ORDER)[number];

export type RungStatus =
	| { kind: "waiting" }                       // no signal yet
	| { kind: "enumerated"; candidates: number } // SourceScanned arrived
	| { kind: "silent" };                        // stream finished, rung never spoke

export interface ProbeLine { url: string; source: RungId; reached: boolean; }

class ScanState {
	phase = $state<"idle" | "searching" | "done">("idle");
	rungs = $state<Record<RungId, RungStatus>>(/* all waiting */);
	probes = $state<ProbeLine[]>([]);           // append-only, real attempts
	found = $state<DiscoveredEndpoint[]>([]);   // dedup by url
	probedTotal = $state<number | null>(null);  // from `finished` only
	foundTotal = $state<number | null>(null);   // from `finished` only
	error = $state<string | null>(null);

	begin(): void   // phase=searching, reset all fields — called by the view
	                // IMMEDIATELY BEFORE invoking commands.discoverClyffy()
	ingest(e: DiscoveryEventFromBindings): void  // fold ONE event:
	  // sourceScanned  → rungs[source] = enumerated(candidates)
	  // candidateProbed→ probes.push + per-rung answered count derivable
	  // found          → found.push if url unseen
	  // finished       → probedTotal/foundTotal set; every rung still
	  //                  "waiting" flips to "silent"; phase="done"
	fail(message: string): void  // command returned error → error + phase=done
	reconcile(final: DiscoveredEndpoint[]): void // command Ok payload is the
	  // authoritative final list — union by url, never delete streamed truth
}
export const scanState = new ScanState();
```

   Per-rung answered counts: `$derived` in the panel from `probes` (count
   `reached && source === rung`), NOT stored twice.
   Every field is derived from a received event — the class fabricates
   NOTHING (no timers, no simulated progress, no optimistic states).
2. Add `ScanPanelProps` to wizard.types.ts:

```ts
/** Props for the live scan surface (ui/ScanPanel.svelte). `copy` is the
 *  [connect] SSOT table; every rendered string comes from it. The panel is
 *  pure render — it reads the model, calls nothing. */
export interface ScanPanelProps {
	copy: ConnectCopy | null;
	phase: "idle" | "searching" | "done";
	rungs: Record<RungId, RungStatus>;
	probes: ProbeLine[];
	probedTotal: number | null;
	foundTotal: number | null;
	error: string | null;
}
```

   (import RungId/RungStatus/ProbeLine from `../scan.state.svelte.js` —
   types flow FROM the state module; found-endpoint cards stay in the VIEW,
   not the panel — R4c owns them.)
3. Author `ui/ScanPanel.svelte`:
   - Renders NOTHING when `phase === "idle"` (`{#if phase !== "idle"}`) — the
     pop-up-on-scan behavior, honest by construction.
   - Structure (base blocks + preset chain):

```
<Card preset="wizard-inset" class="scan-panel">        ← carved-in well (R3a)
  header row: sweep dot + <Heading size="sm">{copy.scan_title}</Heading>
              + <Text size="xs" color="muted">{copy.scan_subtitle}</Text>
  rung list: one row per RUNG_ORDER entry —
    <Tooltip> wrapping the row label (copy.scan_rung_{id}_tip)
    label = copy.scan_rung_{id}
    status cell, EXACTLY these mappings:
      waiting + phase=searching → <Spinner size="xs" tone="accent"/> + copy.scan_rung_waiting
      enumerated{candidates=0}  → copy.scan_rung_done_none
      enumerated{candidates>0}  → copy.scan_rung_done_some with {count} →
                                  answered-count derived from probes
      silent (only after done)  → copy.scan_rung_not_run
                                  (+ tooltip copy.scan_rung_not_run_tip)
  probe stream: mono muted lines, newest appended,
    copy.scan_probe_trying with {url} → probe.url, suffixed
    copy.scan_probe_answered / copy.scan_probe_silent by probe.reached;
    container max-height ~clamp(6rem, 12cqi, 9rem), overflow-y auto,
    scrolls itself pinned to bottom
  footer line (phase=done):
    foundTotal>0 → copy.scan_finished_some ({found},{probed} substituted)
    foundTotal=0 → copy.scan_finished_none
    error        → copy.scan_error with {error}
</Card>
```

   - The sweep animation (the "cool scanning" motion — REAL-state-gated,
     UNIVERSAL effect): a `.scan-sweep` disc in the header binding the
     `cl-radar-sweep` keyframe landed in R3a via the keyframes SSOT's OWN
     documented consumption pattern (keyframes.css header:
     `class="animate-[cl-radar-sweep_2s_linear_infinite]"` — the 2s/linear
     mirror the `radar-sweep` animation token verbatim). ZERO scoped
     `@keyframes` — the keyframe lives in the SSOT, usable by any surface.
     Disc paint = tokens only:
     `background: conic-gradient(from 0deg, var(--cta-main), transparent 70%)`,
     `border-radius: 50%`, size `clamp(1rem, 2cqi, 1.5rem)`.
     RENDERED ONLY inside `{#if phase === "searching"}` — when done it is
     REPLACED by a static state dot (`Badge` or token-colored dot). The
     animation cannot outlive the real scan. Reduced motion: probe for a
     global reduced-motion guard over the `animate-[…]` utilities
     (`grep -rn "prefers-reduced-motion" src/app.css src/lib/design/generated/ src/styles/ | head`);
     if none exists, the component adds the one a11y guard
     `@media (prefers-reduced-motion: reduce) { .scan-sweep { animation: none; } }`
     (an a11y override, not an effect definition — BackgroundScene precedent).
   - Row status transitions animate via
     `transition: color var(--duration-fast) ease` — motion, no glow.
   - All scoped CSS: layout + tokens only; rem + cqi. NO `@keyframes` in this
     file — verify step greps for it.
4. Rewire `EndpointView.svelte`:
   - Delete local `discovery`/`found`/`discoverError` runes and the
     found-only `onMount` listener.
   - New listener (same onMount seam): every payload event →
     `scanState.ingest(payload.event)` — ALL four kinds, spellings from the
     step-2 probe.
   - `discover()` → `scanState.begin(); const r = await commands.discoverClyffy();`
     `r.ok → scanState.reconcile(r.data)`; `r.error → scanState.fail(String(r.error))`.
   - Mount `<ScanPanel copy={copy} phase={scanState.phase} … />` between the
     discover row and the found list; discover button
     disabled/spinner-gated on `scanState.phase === "searching"`; found-list
     section reads `scanState.found` (still inline Cards until R4c);
     none-found copy gated on `scanState.phase === "done" &&
     scanState.foundTotal === 0 && !scanState.error`.
   - Discover button gains its Tooltip (copy.discover_tooltip).
5. `pnpm check` 0/0 · `no-raw-values` 0 · English-in-diff grep clean.
6. HMR gate — the operator clicks Find my Clyffy and WATCHES: panel pops,
   sweep spins while (and only while) the ladder runs, rungs report truth,
   probe lines stream, totals land. With clyffyd nonexistent the honest
   render is rungs reporting / probes answering nothing / scan_finished_none
   — THAT is success (real failure rendered truthfully beats fake success).
7. Commit + push: `feat(desktop): ScanPanel + scan state — live no-mock scan surface, signal-proven rows (R4b)`.

## IMPORT REPOINTS

New modules consumed only by EndpointView. After: `grep -rn "scanState\|ScanPanel" interfaces/desktop/src/`
→ exactly scan.state.svelte.ts, ScanPanel.svelte, EndpointView.svelte,
wizard.types.ts.

## VERIFY

Step 5 output · diff-stat = 4 files · the repoint grep · grep ScanPanel.svelte
for `setTimeout|setInterval|Math.random` → ZERO (no fabricated progress) ·
grep ScanPanel.svelte for `@keyframes` → ZERO (effects are universal — the
keyframe lives in the SSOT).

## KNOWN REDS

Baseline only.

## ROLLBACK

`git checkout -- <files>` ; `git clean -f` the two new files.

## STOP CONDITIONS

- bindings.ts kind/source literals differ from expectations AND from any
  consistent camelCase mapping → STOP, paste the real union.
- The step-3 probe shows `SourceScanned` semantics contradicting the model
  (e.g. emitted BEFORE enumeration) → STOP, report; the model must match the
  backend's truth, not vice versa.
- Tooltip/Card/Spinner composition impossible without touching design/ →
  STOP.
