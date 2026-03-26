<!--
	@component Stat
	@kind stat
	@layer component
	@category content
	@description Numeric display for key metrics with optional label, trend indicator, and delta
	@container false
	@compound true
	@blockCategory data
	@defaultStyle stat-default
	@styleIds stat-default
	@requiredAxes typography, color
	@slots root:all, value:none, label:none, delta:none, icon:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { StatProps, StatSize } from "./stat.types.js";

const SIZE: Record<StatSize, { value: string; label: string }> = {
	sm: {
		value: "text-[var(--stat-root-value-font-size,1.125rem)] font-[var(--stat-root-value-font-weight,700)]",
		label: "text-[var(--stat-root-label-font-size,0.6875rem)]",
	},
	md: {
		value: "text-[var(--stat-root-value-font-size,1.5rem)] font-[var(--stat-root-value-font-weight,700)]",
		label: "text-[var(--stat-root-label-font-size,0.75rem)]",
	},
	lg: {
		value: "text-[var(--stat-root-value-font-size,2rem)] font-[var(--stat-root-value-font-weight,700)]",
		label: "text-[var(--stat-root-label-font-size,0.875rem)]",
	},
};

let {
	value,
	label,
	unit = "",
	size = "md",
	accent = "teal",
	children,
	class: className,
}: StatProps = $props();

const sizeClasses = $derived(SIZE[size] ?? SIZE.md);
</script>

<StyleMacro kind="stat" intent="default">
	<div
		data-kind="stat"
		data-slot="root"
		class={cn("flex flex-col gap-[var(--stat-root-gap,0.25rem)]", className)}
	>
		{#if label}
			<span
				data-kind="stat"
				data-slot="label"
				class={cn(sizeClasses.label, "text-[var(--stat-root-label-color,var(--text-muted))]")}
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
					"tabular-nums",
					"font-[family-name:var(--stat-root-value-font-family,var(--font-display))]",
					"text-[var(--stat-root-value-color,var(--color-teal-400))]")}
				style="text-shadow: 0 0 var(--stat-root-value-glow-radius, 0.75rem) var(--stat-root-value-glow-color, transparent);"
			>
				{value}{unit}
			</span>
		{/if}
	</div>
</StyleMacro>
