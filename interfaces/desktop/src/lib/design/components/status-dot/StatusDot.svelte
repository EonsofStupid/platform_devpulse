<!--
	@component Status Dot
	@kind status-dot
	@layer component
	@category content
	@description Small colored circle indicating online, offline, busy, or other presence states
	@container false
	@compound false
	@blockCategory content
	@defaultStyle status-dot-default
	@styleIds status-dot-default, status-dot-online, status-dot-offline, status-dot-busy, status-dot-away
	@requiredAxes backgroundColor, border, borderRadius
	@slots root:all
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { StatusDotProps, StatusDotSize } from "./status-dot.types.js";

const SIZE: Record<StatusDotSize, string> = {
	sm: "h-[var(--status-dot-root-size,0.375rem)] w-[var(--status-dot-root-size,0.375rem)]",
	md: "h-[var(--status-dot-root-size,0.5rem)] w-[var(--status-dot-root-size,0.5rem)]",
	lg: "h-[var(--status-dot-root-size,0.625rem)] w-[var(--status-dot-root-size,0.625rem)]",
};

let {
	status = "pending",
	size = "md",
	animate = false,
	class: className,
}: StatusDotProps = $props();

const styleId = $derived(`status-dot-${status}`);
</script>

<StyleMacro kind="status-dot" style={styleId}>
	<span
		data-kind="status-dot"
		data-slot="root"
		data-status={status}
		class={cn(
			"inline-block rounded-full shrink-0",
			`bg-[var(--status-dot-root-color-${status},currentColor)]`,
			`shadow-[0_0_var(--status-dot-root-glow-radius,0.375rem)_var(--status-dot-root-color-${status},currentColor)]`,
			SIZE[size] ?? SIZE.md,
			animate && "animate-pulse",
			className)}
		aria-hidden="true"
	></span>
</StyleMacro>
