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
-->
<script lang="ts">
import { useLoadingOverlay } from "$lib/design/primitives/loading-overlay/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { LoadingOverlayComponentProps } from "./types.js";

let {
	visible = false,
	children,
	class: className,
	...rest
}: LoadingOverlayComponentProps = $props();

const overlay = $derived(useLoadingOverlay({ visible }));
const styleId = "loading-overlay-default";
</script>

{#if visible}
	<StyleMacro kind="loading-overlay" style={styleId}>
		<div
			{...overlay.root}
			data-kind="loading-overlay"
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
	</StyleMacro>
{/if}
