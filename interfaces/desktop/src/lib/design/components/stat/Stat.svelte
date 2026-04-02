<!--
	@component Stat
	@kind stat
	@render html
	@category content
	@description Numeric display for key metrics. Label above, big number below.
	Optional unit suffix, accent glow, and trend indicator.
	Uses text/accent tokens from SD5. No fake vars.

	@defaultStyle stat-default
	@slots root:all, value:none, label:none

	@example
	<Stat label="Projects" value={4} />
	<Stat label="CPU" value={14} unit="%" accent="teal" size="lg" glow />
-->
<script lang="ts">
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { StatProps, StatSize } from "./stat.types.js";

type AccentName = "teal" | "purple" | "magenta" | "ember" | "frost" | "cyber";

const SIZE: Record<StatSize, { value: string; label: string }> = {
	sm: { value: "text-lg", label: "text-xs" },
	md: { value: "text-2xl", label: "text-xs" },
	lg: { value: "text-3xl", label: "text-sm" },
};

const ACCENT_COLOR: Record<AccentName, { main: string; glow: string }> = {
	teal: { main: "var(--accent-teal-main)", glow: "var(--accent-teal-glow)" },
	purple: { main: "var(--accent-purple-main)", glow: "var(--accent-purple-glow)" },
	magenta: { main: "var(--accent-magenta-main)", glow: "var(--accent-magenta-glow)" },
	ember: { main: "var(--accent-ember-main)", glow: "var(--accent-ember-glow)" },
	frost: { main: "var(--accent-frost-main)", glow: "var(--accent-frost-glow)" },
	cyber: { main: "var(--accent-cyber-main)", glow: "var(--accent-cyber-glow)" },
};

let {
	value,
	label,
	unit = "",
	size = "md",
	accent = "teal",
	glow = false,
	preset = "default",
	children,
	class: className,
	...rest
}: StatProps = $props();

const sizeClasses = $derived(SIZE[size] ?? SIZE.md);
const colors = $derived(ACCENT_COLOR[accent as AccentName] ?? ACCENT_COLOR.teal);
const m = $derived(renderForge({ kind: "stat", preset }));
</script>

<div
		{...m.dataAttrs}
		data-slot="root"
		style={cssVarString(m.cssVars)}
		class={cn("flex flex-col gap-1", className)}
		{...rest}
	>
		{#if label}
			<span
				data-kind="stat"
				data-slot="label"
				class={cn(sizeClasses.label, "text-[var(--text-muted)]")}
			>
				{label}
			</span>
		{/if}
		{#if children}
			{@render children()}
		{:else if value !== undefined}
			<span
				data-kind="stat"
				data-slot="value"
				class={cn(
					sizeClasses.value,
					"tabular-nums font-bold",
				)}
				style="font-family: var(--font-display); color: {colors.main};{glow ? ` text-shadow: 0 0 0.75rem ${colors.glow};` : ''}"
			>
				{value}{unit}
			</span>
		{/if}
	</div>
