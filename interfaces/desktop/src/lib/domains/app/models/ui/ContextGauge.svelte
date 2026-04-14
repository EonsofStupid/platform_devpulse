<!--
  @file ContextGauge — Arc gauge showing context window usage.
  How much of the conversation memory is used.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import type { SemanticIntent } from "$lib/design/visual/preset-id.js";

interface Props {
	usedTokens: number;
	maxTokens: number;
	label?: string;
	size?: number;
}

let { usedTokens, maxTokens, label = "Context Window", size = 140 }: Props = $props();

const percent = $derived(maxTokens > 0 ? (usedTokens / maxTokens) * 100 : 0);
const pages = $derived(Math.round(usedTokens / 1500));
const maxPages = $derived(Math.round(maxTokens / 1500));

const intent: SemanticIntent = $derived.by(() => {
	if (percent < 50) return "success";
	if (percent < 80) return "warning";
	return "danger";
});

const m = $derived(renderForge({ kind: "context-gauge", preset: intent }));

const arcColor = $derived.by(() => {
	if (percent < 50) return "oklch(0.7 0.15 200)";
	if (percent < 80) return "oklch(0.75 0.15 85)";
	return "oklch(0.65 0.2 25)";
});

const arcGlow = $derived.by(() => {
	if (percent < 50) return "drop-shadow(0 0 0.375rem oklch(0.7 0.15 200 / 0.5))";
	if (percent < 80) return "drop-shadow(0 0 0.375rem oklch(0.75 0.15 85 / 0.5))";
	return "drop-shadow(0 0 0.375rem oklch(0.65 0.2 25 / 0.5))";
});

// SVG arc math (same as VramGauge)
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
	class="flex flex-col items-center gap-1.5"
	title="Shows how much conversation memory Clyffy is using — when full, older messages are forgotten"
>
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<path
			d={bgPath}
			fill="none"
			stroke="oklch(0.3 0.015 230)"
			stroke-width="8"
			stroke-linecap="round"
			opacity="0.5"
		/>
		{#if percent > 0}
			<path
				d={fillPath}
				fill="none"
				stroke={arcColor}
				stroke-width="8"
				stroke-linecap="round"
				style="filter: {arcGlow};"
			/>
		{/if}

		<text
			x={cx} y={cy - 8}
			text-anchor="middle"
			fill={arcColor}
			font-size="20" font-weight="700"
			font-family="var(--font-family, monospace)"
			style="filter: drop-shadow(0 0 0.25rem {arcColor});"
		>
			{Math.round(percent)}%
		</text>
		<text x={cx} y={cy + 8} text-anchor="middle" fill="oklch(0.7 0 0)" font-size="10">
			~{pages} / {maxPages} pages
		</text>
		<text x={cx} y={cy + 22} text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">
			{usedTokens.toLocaleString()} tokens
		</text>
	</svg>

	<span
		class="text-xs font-medium text-center max-w-[10rem] truncate"
		style="color: {arcColor};"
	>
		{label}
	</span>
</div>
