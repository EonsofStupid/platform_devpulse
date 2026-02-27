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
	import type { LoadingOverlayComponentProps } from "./types.js";
	import { createLoadingOverlay } from "$lib/design/api/adapters/coldlight/_internal/loading-overlay/index.js";
	import LoadingOverlayRoot from "$lib/design/primitives/loading-overlay/LoadingOverlay.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { loadingOverlayRecipe } from "./recipe.js";

	let {
		visible = false,
		onVisibleChange,
		children,
		class: className,
		...rest
	}: LoadingOverlayComponentProps = $props();

	const builder = createLoadingOverlay({
		visible: () => visible,
		onVisibleChange,
	});

	const classes = $derived(cn(loadingOverlayRecipe(), className));
</script>

<LoadingOverlayRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</LoadingOverlayRoot>
