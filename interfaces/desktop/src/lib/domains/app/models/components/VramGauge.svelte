<!--
  @file VramGauge — Arc gauge showing GPU memory usage.
  Preset-driven color: success (<60%) → warning (60-85%) → danger (>85%).
  No GPU: shows empty arc with muted styling + error reason if available.
  Uses renderForge for all color resolution.
-->
<script lang="ts">
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import type { SemanticIntent } from "$lib/design/visual/preset-id.js";
import { formatMb } from "../types/models.types.js";

interface Props {
	usedMb: number;
	totalMb: number;
	hasGpu: boolean;
	gpuError?: string | null;
	label?: string;
	size?: number;
}

let {
	usedMb,
	totalMb,
	hasGpu,
	gpuError = null,
	label = "GPU Memory",
	size = 140,
}: Props = $props();

const percent = $derived(totalMb > 0 ? (usedMb / totalMb) * 100 : 0);
const freeMb = $derived(totalMb - usedMb);

const intent: SemanticIntent = $derived.by(() => {
	if (!hasGpu) return "neutral";
	if (percent < 60) return "success";
	if (percent < 85) return "warning";
	return "danger";
});

const m = $derived(renderForge({ kind: "vram-gauge", preset: intent }));

// Accent color for the fill arc
const arcColor = $derived.by(() => {
	if (!hasGpu) return "oklch(0.4 0 0)";
	if (percent < 60) return "oklch(0.7 0.15 155)";
	if (percent < 85) return "oklch(0.75 0.15 85)";
	return "oklch(0.65 0.2 25)";
});

const arcGlow = $derived.by(() => {
	if (!hasGpu) return "none";
	if (percent < 60) return "drop-shadow(0 0 0.375rem oklch(0.7 0.15 155 / 0.5))";
	if (percent < 85) return "drop-shadow(0 0 0.375rem oklch(0.75 0.15 85 / 0.5))";
	return "drop-shadow(0 0 0.375rem oklch(0.65 0.2 25 / 0.5))";
});

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
	class="flex flex-col items-center gap-1.5"
>
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<!-- Background arc — always visible -->
		<path
			d={bgPath}
			fill="none"
			stroke={hasGpu ? "oklch(0.3 0.015 230)" : "oklch(0.2 0 0)"}
			stroke-width="8"
			stroke-linecap="round"
			opacity="0.5"
		/>
		<!-- Fill arc — only with GPU data -->
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

		<!-- Center content -->
		{#if hasGpu}
			<!-- GPU: show used/total -->
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
				{formatMb(usedMb)} / {formatMb(totalMb)}
			</text>
			<text x={cx} y={cy + 22} text-anchor="middle" fill="oklch(0.5 0 0)" font-size="9">
				{formatMb(freeMb)} free
			</text>
		{:else}
			<!-- No GPU: show status -->
			<text
				x={cx} y={cy - 4}
				text-anchor="middle"
				fill="oklch(0.55 0 0)"
				font-size="14" font-weight="600"
			>
				No GPU
			</text>
			<text x={cx} y={cy + 12} text-anchor="middle" fill="oklch(0.4 0 0)" font-size="9">
				{#if gpuError}
					{gpuError.length > 24 ? gpuError.slice(0, 24) + "…" : gpuError}
				{:else}
					CPU Mode
				{/if}
			</text>
		{/if}
	</svg>

	<!-- Label below gauge -->
	<span
		class="text-xs font-medium text-center max-w-[10rem] truncate"
		style="color: {hasGpu ? arcColor : 'oklch(0.5 0 0)'};"
	>
		{label}
	</span>
</div>
