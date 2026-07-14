<!--
	@component AnatomyConstellation
	@module @devpulse/domains/app/models/feature/setup-wizard/ui

	**Layout-only** wrapper that arranges five [`AnatomyTile`]s in a
	chest-piece constellation:

	```
	┌──────────────────────────────────────────────┐
	│              ┌────────────┐                  │
	│              │   Brain    │  ← deep reasoning│
	│              └────────────┘                  │
	│  ┌────────┐  ┌────────────┐  ┌────────┐      │
	│  │  Eyes  │  │  Sparkles  │  │  Ears  │      │
	│  └────────┘  └────────────┘  └────────┘      │
	│              ┌────────────┐                  │
	│              │   Mouth    │  ← speech out    │
	│              └────────────┘                  │
	└──────────────────────────────────────────────┘
	```

	Brain is up top because the deep-reasoning model is the apex of
	the capability stack. Sparkles centers because the minion is the
	thing that talks to everything else. Eyes/Ears flank as the
	input senses. Mouth sits below as the output.

	## CSS Grid named areas

	Implemented with `grid-template-areas` so the visual order is
	declared once and the DOM order can stay logical for AT users
	(brain → sparkles → eyes → ears → mouth, top-down then left-right).

	## Responsive

	At narrow viewports the constellation collapses to a single
	column (still in DOM order). The `clamp()` on `gap` keeps tile
	density natural across viewport widths.

	## No color, no chrome

	This file authors LAYOUT only — gap, alignment, grid. Tiles
	paint themselves via their `accentVar`. Nothing in this file's
	`<style>` block sets background, border, or shadow.
-->
<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
	/** Brain slot tile (deep reasoning — top center). */
	brain: Snippet;
	/** Eyes slot tile (vision input — middle left). */
	eyes: Snippet;
	/** Sparkles slot tile (minion / coder + embedder — middle center). */
	sparkles: Snippet;
	/** Ears slot tile (STT input — middle right). */
	ears: Snippet;
	/** Mouth slot tile (TTS output — bottom center). */
	mouth: Snippet;
}

let { brain, eyes, sparkles, ears, mouth }: Props = $props();
</script>

<div class="constellation" role="group" aria-label="Clyffy anatomy slots">
	<div class="cell cell-brain">{@render brain()}</div>
	<div class="cell cell-sparkles">{@render sparkles()}</div>
	<div class="cell cell-eyes">{@render eyes()}</div>
	<div class="cell cell-ears">{@render ears()}</div>
	<div class="cell cell-mouth">{@render mouth()}</div>
</div>

<style>
	.constellation {
		display: grid;
		grid-template-columns: 1fr 1.15fr 1fr;
		grid-template-rows: auto auto auto;
		grid-template-areas:
			". brain ."
			"eyes sparkles ears"
			". mouth .";
		/* Container-fluid (S1.C): the constellation sizes to its zone's
		   seam (setup-overlay / devtools), not the OS viewport. */
		gap: clamp(0.875rem, 1.6cqi, 1.5rem);
		width: 100%;
		max-width: 64rem;
		margin-inline: auto;
		align-items: stretch;
	}

	.cell-brain { grid-area: brain; }
	.cell-sparkles { grid-area: sparkles; }
	.cell-eyes { grid-area: eyes; }
	.cell-ears { grid-area: ears; }
	.cell-mouth { grid-area: mouth; }

	.cell {
		display: flex;
		min-width: 0;
	}
	.cell > :global(*) {
		flex: 1;
		min-width: 0;
	}

	/* Narrow CONTAINER — collapse to single column (queries the nearest
	   seam, not the viewport). DOM order already top-to-bottom matches
	   the constellation's logical reading order, so AT users hear the
	   same sequence. */
	@container (max-width: 56rem) {
		.constellation {
			grid-template-columns: 1fr;
			grid-template-rows: repeat(5, auto);
			grid-template-areas:
				"brain"
				"sparkles"
				"eyes"
				"ears"
				"mouth";
		}
	}
</style>
