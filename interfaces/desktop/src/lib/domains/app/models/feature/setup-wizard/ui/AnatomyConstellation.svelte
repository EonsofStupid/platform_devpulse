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
	the cortex stack. Sparkles centers because the minion is the
	thing that talks to everything else. Eyes/Ears flank as the
	input senses. Mouth sits below as the output.

	## CSS Grid named areas

	Implemented with `grid-template-areas` so the visual order is
	declared once and the DOM order can stay logical for AT users
	(brain → sparkles → eyes → ears → mouth, top-down then left-right).

	## Responsive — container, not viewport

	The wrapper is a Tailwind `@container`. Below the `@3xl` container
	width (48rem) the constellation is a single column in DOM order;
	at `@3xl` and up it becomes the three-column chest piece. Sizing
	follows the space the constellation is actually given (e.g. a
	40rem wizard card), not the window width.

	## No color, no chrome

	Layout only, authored entirely as Tailwind utilities (Tailwind owns
	layout + structure; ColdLight owns visuals). Tiles paint themselves
	via their `accentVar`.
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

<div class="@container w-full">
	<div
		class="mx-auto grid w-full max-w-5xl grid-cols-1 items-stretch gap-4 [grid-template-areas:'brain'_'sparkles'_'eyes'_'ears'_'mouth'] @3xl:grid-cols-[1fr_1.15fr_1fr] @3xl:gap-6 @3xl:[grid-template-areas:'._brain_.'_'eyes_sparkles_ears'_'._mouth_.']"
		role="group"
		aria-label="Cortex anatomy slots"
	>
		<div class="flex min-w-0 *:min-w-0 *:flex-1 [grid-area:brain]">{@render brain()}</div>
		<div class="flex min-w-0 *:min-w-0 *:flex-1 [grid-area:sparkles]">{@render sparkles()}</div>
		<div class="flex min-w-0 *:min-w-0 *:flex-1 [grid-area:eyes]">{@render eyes()}</div>
		<div class="flex min-w-0 *:min-w-0 *:flex-1 [grid-area:ears]">{@render ears()}</div>
		<div class="flex min-w-0 *:min-w-0 *:flex-1 [grid-area:mouth]">{@render mouth()}</div>
	</div>
</div>
