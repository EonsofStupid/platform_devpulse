<!--
	@component Stat
	@kind stat

	THE PRODUCT. Metric display with display font + text glow.
	Accent drives glow color. Size drives typography scale.
	All visual from DTCG tokens.
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
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

const styleId = $derived(`stat-${accent}`);
const sizeClasses = $derived(SIZE[size] ?? SIZE.md);
</script>

<StyleMacro kind="stat" style={styleId}>
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
					"text-[var(--stat-root-value-color,var(--color-teal-400))]",
				)}
				style="text-shadow: 0 0 var(--stat-root-value-glow-radius, 0.75rem) var(--stat-root-value-glow-color, transparent);"
			>
				{value}{unit}
			</span>
		{/if}
	</div>
</StyleMacro>
