<!--
	@component Loading Overlay
	@kind loading-overlay
	@layer component
	@category feedback
	@description Full-area translucent overlay with spinner indicating background loading state
	@container false
	@compound true
	@blockCategory feedback
	@defaultStyle loading-overlay-default
	@styleIds loading-overlay-default
	@requiredAxes backgroundColor, opacity
	@slots root:all, overlay:none, spinner:none, label:none
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
import { useLoadingOverlay } from "$lib/design/behaviors/loading-overlay/index.js";
import { resolveMacro, cssVarString } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { LoadingOverlayComponentProps } from "./types.js";

let {
	preset = "default",
	visible = false,
	children,
	class: className,
	...rest
}: LoadingOverlayComponentProps = $props();

const overlay = $derived(useLoadingOverlay({ visible }));
const m = $derived(resolveMacro({ kind: "loading-overlay", preset }));
</script>

{#if visible}
	<div
		{...overlay.root}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		data-slot="root"
		data-state={visible ? "visible" : "hidden"}
		class={cn(
			"absolute inset-0 z-50 flex items-center justify-center",
			className)}
		{...rest}
	>
		{#if children}
			{@render children()}
		{:else}
			<div class="animate-spin size-6" data-kind="loading-overlay" data-slot="spinner" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="size-full">
					<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
					<path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
				</svg>
			</div>
		{/if}
	</div>
{/if}
