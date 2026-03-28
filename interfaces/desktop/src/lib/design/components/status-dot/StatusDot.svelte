<!--
	@component StatusDot
	@kind status-dot
	@render html
	@category feedback
	@description Colored indicator dot for presence, health, or connection state.
	Maps status to signal/text tokens from SD5. No hardcoded colors. Glow optional.

	@defaultStyle status-dot-default
	@slots root:all

	@example
	<StatusDot status="ready" />
	<StatusDot status="failed" size="lg" glow />
	<StatusDot status="loading" animate />
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { StatusDotProps, StatusDotSize, StatusDotStatus } from "./status-dot.types.js";

/**
 * Status → token color mapping.
 * 6 tones from SD5 output:
 *   signal-success (green), signal-warning (amber), signal-error (red),
 *   signal-info (blue), text-muted (dim), text-disabled (very dim)
 */
const STATUS_COLOR: Record<StatusDotStatus, string> = {
	ready: "var(--signal-success)",
	online: "var(--signal-success)",
	loading: "var(--signal-warning)",
	failed: "var(--signal-error)",
	hybrid: "var(--signal-info)",
	pending: "var(--text-muted)",
	offline: "var(--text-disabled)",
};

const SIZE_PX: Record<StatusDotSize, string> = {
	sm: "0.375rem",
	md: "0.5rem",
	lg: "0.625rem",
};

let {
	status = "pending",
	size = "md",
	animate = false,
	glow = false,
	class: className,
}: StatusDotProps = $props();

const color = $derived(STATUS_COLOR[status] ?? STATUS_COLOR.pending);
const dim = $derived(SIZE_PX[size] ?? SIZE_PX.md);
</script>

<span
	data-kind="status-dot"
	data-slot="root"
	data-status={status}
	class={cn(
		"inline-block rounded-full shrink-0",
		animate && "animate-pulse",
		className,
	)}
	style="width: {dim}; height: {dim}; background: {color};{glow ? ` box-shadow: 0 0 0.375rem ${color};` : ''}"
	aria-hidden="true"
></span>
