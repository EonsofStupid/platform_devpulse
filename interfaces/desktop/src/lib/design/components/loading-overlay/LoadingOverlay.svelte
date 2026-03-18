<!--
	@component LoadingOverlay
	@kind loading-overlay
	@layer components

	ColdLight LoadingOverlay — wraps structureless LoadingOverlay primitive with:
	- ARIA attributes (role="alert", aria-busy, aria-label="Loading")
	- State derivation (data-state: visible/hidden)
	- SD5 token-driven recipe

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
import { createLoadingOverlay } from "$lib/design/api/dsadapters/coldlight/_internal/loading-overlay/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import LoadingOverlayRoot from "$lib/design/primitives/loading-overlay/LoadingOverlay.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { loadingOverlayRecipe } from "./recipe.js";
import type { LoadingOverlayComponentProps } from "./types.js";

let {
	// Kind-specific props
	visible = false,
	onVisibleChange,
	children,
	class: className,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
	// Rest spread
	...rest
}: LoadingOverlayComponentProps = $props();

const builder = createLoadingOverlay({
	visible: () => visible,
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from builder
	onVisibleChange: (v: any) => onVisibleChange?.(v),
});

// Resolve ColdLight visual
const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));

// Compose: structural recipe + ColdLight visual + user classes
const classes = $derived(cn(loadingOverlayRecipe(), visual.segments, visual.radius, className));
</script>

<LoadingOverlayRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</LoadingOverlayRoot>
