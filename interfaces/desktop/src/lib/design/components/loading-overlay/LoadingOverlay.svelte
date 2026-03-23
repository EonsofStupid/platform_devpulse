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
import LoadingOverlayRoot from "$lib/design/primitives/loading-overlay/LoadingOverlay.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { loadingOverlayRecipe } from "./recipe.js";
import type { LoadingOverlayComponentProps } from "./types.js";

let {
	// Kind-specific props
	visible = false,
	onVisibleChange,
	children,
	class: className,
	size,
	...rest
}: LoadingOverlayComponentProps = $props();

const builder = createLoadingOverlay({
	visible: () => visible,
		onVisibleChange: (v: any) => onVisibleChange?.(v),
});

// Resolve ColdLight visual
// Compose: structural recipe + ColdLight visual + user classes
const classes = $derived(cn(loadingOverlayRecipe(), className));
</script>

<LoadingOverlayRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</LoadingOverlayRoot>
