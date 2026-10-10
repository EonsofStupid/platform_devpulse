# R4c — FoundEndpointCard + ManualEntry: the confirm + fallback wells

## GOAL

The two remaining inline surfaces of EndpointView become typed colocated
variants: `FoundEndpointCard` (a verified endpoint's capability card with
Connect CTA) and `ManualEntry` (the address well — inset neumorphic input).
Tooltips everywhere; every string SSOT.

Component law: as stated in slice-R4a.

## PRECONDITIONS

1. R4a + R4b DONE. Tree clean.
2. Probe: `grep -n "found-card\|address-panel" …/feature/views/EndpointView.svelte`
   → hits (the inline Card sections + their scoped CSS). Zero → STOP.

## FILES

1. `…/setup-wizard/ui/FoundEndpointCard.svelte` — NEW.
2. `…/setup-wizard/ui/ManualEntry.svelte` — NEW.
3. `…/setup-wizard/util/wizard.types.ts` — two prop interfaces.
4. `…/setup-wizard/feature/views/EndpointView.svelte` — rewire + CSS strip.

## STEPS

1. wizard.types.ts:

```ts
/** Props for one verified endpoint's capability card. Everything shown is
 *  COMPUTED from the live handshake (kind/version/slots) — never assumed. */
export interface FoundEndpointCardProps {
	endpoint: DiscoveredEndpoint;
	/** Connect in flight (this card or globally busy). */
	working: boolean;
	confirmLabel: string;      // copy.confirm_cta
	confirmTooltip: string;    // copy.confirm_tooltip
	onConfirm: (url: string) => void | Promise<void>;
}

/** Props for the manual address well — always reachable, never the front
 *  door. Copy pre-resolved from [connect]. */
export interface ManualEntryProps {
	label: string;             // copy.url_label
	placeholder: string;       // copy.url_placeholder
	inputAria: string;         // copy.url_aria
	inputTooltip: string;      // copy.url_tooltip
	connectLabel: string;      // copy.connect_cta
	connectAria: string;       // copy.connect_aria
	working: boolean;
	disabled: boolean;
	/** Real command error text (String(r.error)) or null. */
	errorText: string | null;
	/** True failed-status: attempted && settled && disconnected. */
	showFailed: boolean;
	failedHint: string;        // copy.status_failed
	onConnect: (url: string) => void | Promise<void>;
}
```

2. `ui/FoundEndpointCard.svelte`:
   - `<Card preset="wizard-elevated" class="found-card">` — row layout moved
     verbatim from EndpointView's `.found-card` CSS (:376-382). Meta column:
     `<Heading level={4} size="sm">{endpoint.capability.kind}</Heading>` +
     `<Text size="xs" color="muted">{endpoint.url}</Text>` + badges
     (`{endpoint.capability.version}`, `{endpoint.capability.slots.length}`)
     — wire truth only, no invented labels.
   - Confirm `<Button preset="primary" size="sm">` wrapped in the Tooltip
     trio (confirmTooltip), `disabled={working}`,
     `onclick={() => onConfirm(endpoint.url)}`.
   - Entrance motion (real event → motion, UNIVERSAL effect): the card
     animates in with the EXISTING universal `slide-up` animation
     (keyframes.css + animation.tokens.json — 300ms, one-shot forwards),
     bound via the SSOT's documented utility pattern
     (`class="animate-[slide-up_300ms_cubic-bezier(0,0,0.2,1)_forwards]"` —
     read keyframes.css first for the keyframe's EXACT emitted name
     (`slide-up` vs `cl-slide-up`) and mirror the token's duration/easing
     verbatim). ZERO scoped `@keyframes`. Fires exactly when a VERIFIED
     endpoint materializes (mount = a real `found` signal). Reduced-motion:
     same global-guard probe as R4b — add the one a11y `animation: none`
     media override only if no global guard exists.
   - Move `.found-meta`/`.found-badges` layout rules in.
3. `ui/ManualEntry.svelte`:
   - `<Card preset="wizard-inset" class="manual-panel">` — the carved-in well
     (R3a): head row (Heading + Tooltip on an info affordance carrying
     inputTooltip), input row, error/failed lines.
   - The input: keep the token-bound scoped pattern from
     EndpointView.svelte:415-430 VERBATIM (font-mono, `var(--surface-inset)`
     bg, hairline border, `--cta-main` focus edge) — it already speaks
     tokens; it now lives inside the inset well so the neumorphic reading is
     well-in-well (stark, no glow). Local `urlInput` rune stays INSIDE this
     component (input buffer is view-model, not app state); Connect fires
     `onConnect(urlInput)`.
   - Error line: `errorText` rendered in `var(--accent-danger-main)` (move
     `.error-line` rule); failed hint gated on `showFailed` — both REAL
     states from the probe loop, never fabricated.
4. Rewire EndpointView:
   - found list `{#each scanState.found as endpoint (endpoint.url)}` →
     `<FoundEndpointCard {endpoint} working={working || busy}
     confirmLabel={copy?.confirm_cta ?? ""} confirmTooltip={copy?.confirm_tooltip ?? ""}
     onConfirm={connect} />`.
   - manual section: keep the reveal button (`manual_reveal` + Tooltip
     copy.manual_tooltip); revealed state renders `<ManualEntry …/>` with
     the props table above; DELETE the moved scoped CSS
     (`.found-card/.found-meta/.found-badges/.address-panel/.address-head/
     .address-row/.address-input/.error-line`) and the now-internal
     `urlInput` rune; `connect(url)` keeps owning the command + `attempted`.
   - Unused imports pruned ONLY after grep confirms zero remaining use in
     the file (Card may still wrap nothing — if Card becomes unconsumed
     here, removing its import is correct and expected).
5. `pnpm check` 0/0 · `no-raw-values` 0 · English-diff grep clean.
6. Commit + push: `feat(desktop): FoundEndpointCard + ManualEntry — typed wells, wire-truth capability cards (R4c)`.

## IMPORT REPOINTS

New components consumed only by EndpointView (grep-verified as in R4a/R4b).

## VERIFY

Step 5 · diff-stat = 4 files · `grep -c "Card preset=\"wizard-elevated\"" EndpointView.svelte` → 0 (all wells are variants now) ·
`grep -c "@keyframes" ui/FoundEndpointCard.svelte ui/ManualEntry.svelte` → 0
(effects are universal).

## KNOWN REDS

Baseline only.

## ROLLBACK

`git checkout -- <files>` ; `git clean -f` the two new files.

## STOP CONDITIONS

- `DiscoveredEndpoint`'s capability shape in bindings differs from
  `kind/version/slots` → STOP, paste the real type.
- Any design/ file would need editing → STOP.
