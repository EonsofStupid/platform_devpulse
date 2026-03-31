<!--
  @file VramGauge — Arc gauge showing GPU memory usage.
  Preset-driven color: success (<60%) → warning (60-85%) → danger (>85%).
  Uses resolveMacro for all color resolution.
-->
<script lang="ts">
import { cssVarString, resolveMacro } from "$lib/design/style-macro/index.js";
import type { SemanticIntent } from "$lib/design/visual/preset-id.js";
import { formatMb } from "../types/models.types.js";

interface Props {
	usedMb: number;
	totalMb: number;
	hasGpu: boolean;
	label?: string;
	size?: number;
}

let { usedMb, totalMb, hasGpu, label = "GPU Memory", size = 140 }: Props = $props();

const percent = $derived(totalMb > 0 ? (usedMb / totalMb) * 100 : 0);
const freeMb = $derived(totalMb - usedMb);

const intent: SemanticIntent = $derived.by(() => {
	if (!hasGpu) return "neutral";
	if (percent < 60) return "success";
	if (percent < 85) return "warning";
	return "danger";
});

const m = $derived(resolveMacro({ kind: "vram-gauge", preset: intent }));

// SVG arc math
const cx = $derived(size / 2);
const cy = $derived(size / 2);
const radius = $derived(size / 2 - 12);
const startAngle = 135;
const endAngle = 405;
const totalArc = endAngle - startAngle;
const fillAngle = $derived(startAngle + (totalArc * Math.min(percent, 100)) / 100);

function polarToCart(angleDeg: number, r: number): { x: number; y: number } {
	const rad = ((angleDeg - 90) * Math.PI) / 180;
	return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const bgStart = $derived(polarToCart(startAngle, radius));
const bgEnd = $derived(polarToCart(endAngle, radius));
const fillEnd = $derived(polarToCart(fillAngle, radius));
const largeArcBg = $derived(totalArc > 180 ? 1 : 0);
const largeArcFill = $derived(fillAngle - startAngle > 180 ? 1 : 0);

const bgPath = $derived(
	`M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${largeArcBg} 1 ${bgEnd.x} ${bgEnd.y}`,
);
const fillPath = $derived(
	percent > 0
		? `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${largeArcFill} 1 ${fillEnd.x} ${fillEnd.y}`
		: "",
);
</script>

<div
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class="flex flex-col items-center gap-1"
>
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<!-- Background arc -->
		<path
			d={bgPath}
			fill="none"
			stroke="var(--border-color, currentColor)"
			stroke-width="8"
			stroke-linecap="round"
			opacity="0.3"
		/>
		<!-- Fill arc -->
		{#if percent > 0}
			<path
				d={fillPath}
				fill="none"
				stroke="var(--color, currentColor)"
				stroke-width="8"
				stroke-linecap="round"
			/>
		{/if}
		<!-- Center text -->
		<text
			x={cx}
			y={cy - 6}
			text-anchor="middle"
			fill="var(--color, currentColor)"
			font-size="18"
			font-weight="700"
			font-family="var(--font-family, monospace)"
		>
			{#if hasGpu}
				{formatMb(usedMb)}
			{:else}
				No GPU
			{/if}
		</text>
		<text
			x={cx}
			y={cy + 12}
			text-anchor="middle"
			fill="var(--color, currentColor)"
			font-size="11"
			opacity="0.6"
		>
			{#if hasGpu}
				/ {formatMb(totalMb)}
			{:else}
				CPU Mode
			{/if}
		</text>
		<text
			x={cx}
			y={cy + 28}
			text-anchor="middle"
			fill="var(--color, currentColor)"
			font-size="10"
			opacity="0.4"
		>
			{#if hasGpu}
				{formatMb(freeMb)} free
			{/if}
		</text>
	</svg>
	<span class="text-xs" style="color: var(--color);">{label}</span>
</div>
