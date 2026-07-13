# R4a — ModeCard: typed colocated variant, tooltip, selected color+motion

## GOAL

Author `ModeCard` as a typed wizard-owned variant off the base `Card` block —
tooltip on mouseover, selected/hover color AND motion, preset chain only —
and rewire EndpointView's two inline mode cards through it.

## Component law (applies to every R4 slice)

- Lives in the EXISTING colocated folder
  `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/ui/`
  (beside AnatomyTile — the wizard's established variant folder). NO new
  directories.
- Composes design/ base components ONLY (`Card`, `Text`, `Heading`,
  `Tooltip`/`TooltipTrigger`/`TooltipContent`, `Badge`, `Spinner`, `Button`).
- Wears preset chains (`wizard-elevated` / `wizard-inset`); scoped CSS =
  layout + the ONE sanctioned selected/focus accent overlay (Lock #6) +
  motion transforms. Colors/borders/shadows NEVER authored raw — tokens only.
- Fluid: `clamp(…, Ncqi, …)` sizing (container = `.shell-root`, S1.C).
- Every visible string arrives via props from the copy SSOT — the component
  declares NO English.
- Dumb UI: props in, callback out. No commands, no stores.

## PRECONDITIONS

1. R2 + R3a DONE (tooltip keys exist in bindings; wizard-elevated wears
   bevel-soft). Tree clean.
2. Probe: `grep -n "mode-card" interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/EndpointView.svelte`
   → hits (~lines 152-180, 341-361). Zero → STOP.
3. Probe the tooltip API: read
   `src/lib/design/components/tooltip/index.ts` + `types.ts` + one existing
   consumer (`grep -rn "TooltipTrigger" src/lib --include="*.svelte" -l | head -3`)
   and mirror the real composition pattern exactly. The plan assumes
   `<Tooltip><TooltipTrigger>…</TooltipTrigger><TooltipContent preset="stark">…</TooltipContent></Tooltip>`
   — if the real pattern differs, follow the CODE, not this line.

## FILES

1. `…/setup-wizard/ui/ModeCard.svelte` — NEW.
2. `…/setup-wizard/util/wizard.types.ts` — add `ModeCardProps`.
3. `…/setup-wizard/feature/views/EndpointView.svelte` — replace the two
   inline `<Card as="button" class="mode-card">` blocks; delete the
   now-orphaned `.mode-card` scoped CSS.

## STEPS

1. Add to `wizard.types.ts`:

```ts
/** Props for the wizard's connection-mode card (ui/ModeCard.svelte) —
 *  layman guidance only; discovery covers every mode. Copy arrives
 *  pre-resolved from the [connect] SSOT — the component owns zero English. */
export interface ModeCardProps {
	/** Lucide icon component (resolved by the view). */
	icon: typeof import("lucide-svelte").Home;
	/** Visible mode label (copy.mode_*_label). */
	label: string;
	/** One-line layman hint (copy.mode_*_hint). */
	hint: string;
	/** Mouseover tooltip body (copy.mode_*_tooltip). */
	tooltip: string;
	/** Whether this card is the highlighted mode. */
	selected: boolean;
	/** Disable during busy/searching. */
	disabled?: boolean;
	/** Selection callback. */
	onselect: () => void;
}
```

2. Author `ui/ModeCard.svelte`:
   - Script: `let { icon: Icon, label, hint, tooltip, selected, disabled = false, onselect }: ModeCardProps = $props();`
     (import the type from `../util/wizard.types.js`; import Card, Heading,
     Text, Tooltip trio from their design barrels with `.js` extensions).
   - Template — the whole card IS the tooltip trigger:

```svelte
<Tooltip>
	<TooltipTrigger class="mode-card-trigger">
		<Card
			as="button"
			preset="wizard-elevated"
			class="mode-card"
			aria-pressed={selected}
			data-selected={selected ? "true" : undefined}
			{disabled}
			onclick={onselect}
		>
			<Icon size={18} class="mode-icon" />
			<Heading level={3} size="sm">{label}</Heading>
			<Text size="xs" color="muted">{hint}</Text>
		</Card>
	</TooltipTrigger>
	<TooltipContent preset="stark">{tooltip}</TooltipContent>
</Tooltip>
```

   - Hover/active MOTION comes from the PRESET STATE LEAVES landed in R3a
     (`wizard-elevated-hover` = depth pop + brighter edge;
     `wizard-elevated-active` = press-in) — the universal mechanism, ZERO
     scoped effect CSS in this component. Verify on HMR that hovering a mode
     card visibly lifts via the emitted leaf; if the leaf mechanism requires
     a prop/attr on Card (per R3a's step-0 probe record), wire exactly that.
   - Scoped CSS (LAYOUT ONLY + the one sanctioned overlay):
     - `:global(.mode-card)` — column flex, `gap: clamp(0.375rem, 0.8cqi, 0.5rem)`,
       `padding: clamp(0.875rem, 1.6cqi, 1.125rem)`, `text-align: left`,
       `cursor: pointer`, `width: 100%`.
     - `:global(.mode-card[data-selected])` — MOVE the existing Lock #6
       overlay VERBATIM from EndpointView.svelte:349-354 (blue-tinted glass
       `var(--glass-blue)`, `color-mix` CTA edge, the token-bound shadow
       line). This is a MOVE — byte-identical values, source deleted in
       step 3.
     - `:global(.mode-card:focus-visible)` — move verbatim from
       EndpointView.svelte:355-358. `:global(.mode-icon)` — move verbatim
       from :359-361.
     - `.mode-card-trigger` (or `:global`, per how TooltipTrigger renders) —
       `display: contents;` if TooltipTrigger's span breaks the grid;
       otherwise omit. Decide from the REAL rendered markup, note the choice.
3. Rewire `EndpointView.svelte`:
   - `import ModeCard from "../../ui/ModeCard.svelte";` — note views sit at
     `feature/views/`, ui at `ui/` (two levels up, same as AnatomyTile
     imports in CortexView:60-61).
   - Replace both inline cards inside `.mode-row`:

```svelte
<ModeCard icon={Home} label={copy?.mode_local_label ?? ""} hint={copy?.mode_local_hint ?? ""} tooltip={copy?.mode_local_tooltip ?? ""} selected={mode === "local"} disabled={busy} onselect={() => { mode = "local"; }} />
<ModeCard icon={Server} label={copy?.mode_gb10_label ?? ""} hint={copy?.mode_gb10_hint ?? ""} tooltip={copy?.mode_gb10_tooltip ?? ""} selected={mode === "gb10"} disabled={busy} onselect={() => { mode = "gb10"; }} />
```

   - Delete the moved scoped rules (`.mode-card`, `[data-selected]`,
     `:focus-visible`, `.mode-icon`) from EndpointView's `<style>`; keep
     `.mode-row` (grid layout belongs to the view).
   - Drop now-unused imports (Card stays — found/address panels still use it
     until R4c; verify with grep before removing ANY import).
4. `pnpm check` → 0/0. `no-raw-values` → 0. Grep the diff for hardcoded
   English (`git diff | grep -E '^\+.*"[A-Z][a-z]+ '`) → only copy-key
   fallbacks (`?? ""`) allowed.
5. HMR: two crisp raised mode cards, hover lift, tooltip on mouseover,
   selected card reads blue-edged.
6. Commit + push: `feat(desktop): ModeCard — typed wizard variant, tooltip + selected motion (R4a)`.

## IMPORT REPOINTS

Only EndpointView consumes ModeCard (new). Probe after:
`grep -rn "ModeCard" interfaces/desktop/src/` → exactly the new file + its
one consumer + wizard.types.ts.

## VERIFY

Step 4 raw output; diff-stat = 3 files; the wired-consumer grep above.

## KNOWN REDS

Baseline only.

## ROLLBACK

`git checkout -- <the three files>` ; `git clean -f …/ui/ModeCard.svelte`.

## STOP CONDITIONS

- Tooltip composition pattern in the real code differs structurally from the
  plan AND wrapping a button trigger is impossible without new design/ code →
  STOP, report the actual API.
- Any edit would touch a file outside FILES → STOP.
