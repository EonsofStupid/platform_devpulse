<!--
  @file SpriteAnimator — Single animated sprite using CSS steps().
  Zero JS animation. Pure CSS keyframes with background-position stepping.
  image-rendering: pixelated for crisp 8-bit scaling.
  ALL styling via resolveMacro + cssVarString.
-->
<script lang="ts">
import { cssVarString, resolveMacro } from "$lib/design/style-macro/index.js";
import type { SemanticIntent } from "$lib/design/visual/preset-id.js";
import type { MinionAnimationState } from "./types.js";

interface Props {
	sheet?: string;
	frameWidth?: number;
	frameHeight?: number;
	frameCount?: number;
	fps?: number;
	scale?: number;
	x?: number;
	y?: number;
	state?: MinionAnimationState;
	flipped?: boolean;
	icon?: string;
	label?: string;
}

let {
	sheet,
	frameWidth = 32,
	frameHeight = 32,
	frameCount = 4,
	fps = 8,
	scale = 2,
	x = 0,
	y = 0,
	state = "idle",
	flipped = false,
	icon = "🤖",
	label = "minion",
}: Props = $props();

const displayWidth = $derived(frameWidth * scale);
const displayHeight = $derived(frameHeight * scale);
const sheetWidth = $derived(frameWidth * frameCount);
const animDuration = $derived(`${frameCount / fps}s`);

const intent: SemanticIntent = $derived.by(() => {
	switch (state) {
		case "idle":
			return "neutral";
		case "walking":
			return "info";
		case "working":
			return "success";
		case "escalated":
			return "warning";
	}
});

const m = $derived(resolveMacro({ kind: "sprite-animator", preset: intent }));
const hasSheet = $derived(!!sheet);
</script>

<div
	class="pointer-events-none absolute transition-all duration-500"
	style="left: {x}px; top: {y}px; width: {displayWidth}px; height: {displayHeight}px; transform: scaleX({flipped ? -1 : 1});"
	role="img"
	aria-label="{label} ({state})"
>
	{#if hasSheet}
		<div
			style="width: {displayWidth}px; height: {displayHeight}px; background: url('{sheet}') left top / {sheetWidth * scale}px {displayHeight}px no-repeat; image-rendering: pixelated; animation: sprite-step {animDuration} steps({frameCount}) infinite;"
		></div>
	{:else}
		<div
			{...m.dataAttrs}
			style={cssVarString(m.cssVars)}
			class="flex items-center justify-center rounded"
			style:width="{displayWidth}px"
			style:height="{displayHeight}px"
			style:font-size="{scale * 14}px"
		>
			{icon}
		</div>
	{/if}
</div>

<style>
	@keyframes sprite-step {
		to {
			background-position: right top;
		}
	}
</style>
