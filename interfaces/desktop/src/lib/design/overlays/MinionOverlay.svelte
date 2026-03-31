<!--
  @file MinionOverlay — Global transparent overlay for chibi minion animations.
  Renders above all routes. pointer-events: none so it doesn't block interaction.
  Controlled by MinionOverlayState rune which listens to MAESTRO signals.
-->
<script lang="ts">
import SpriteAnimator from "./SpriteAnimator.svelte";
import type { ActiveMinion } from "./types.js";

/** Active minions on screen — fed from minionOverlayState rune. */
interface Props {
	minions?: ActiveMinion[];
	enabled?: boolean;
}

let { minions = [], enabled = true }: Props = $props();

/** Emoji icons for placeholder rendering. */
const minionIcons: Record<string, string> = {
	guardian: "🛡️",
	enforcer: "⚖️",
	diary: "📔",
	psych: "🧠",
	teacher: "📚",
	scribe: "✍️",
	vision: "👁️",
	researcher: "🔍",
};
</script>

{#if enabled && minions.length > 0}
	<div
		class="pointer-events-none fixed inset-0"
		style="z-index: 9999;"
		aria-hidden="true"
		data-component="minion-overlay"
	>
		{#each minions as minion (minion.minionId)}
			<SpriteAnimator
				x={minion.x}
				y={minion.y}
				state={minion.state}
				flipped={minion.flipped}
				icon={minionIcons[minion.minionId] ?? "🤖"}
				label={minion.minionId}
			/>
		{/each}
	</div>
{/if}
