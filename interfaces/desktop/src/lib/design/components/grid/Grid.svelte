<!--
	@component Grid
	@kind grid
	@layer components

	ColdLight Grid — builder-driven data attributes. ZERO visual.
	Visual (recipe, ColdLight encoding) applied by ui/grid/.
-->
<script lang="ts">
	import type { GridComponentProps } from "./types.js";
	import { createGrid } from "$lib/design/api/adapters/coldlight/_internal/grid/index.js";
	import GridRoot from "$lib/design/primitives/grid/Grid.svelte";

	let { children, class: className, ...rest }: GridComponentProps = $props();

	const builder = createGrid();
</script>

<GridRoot {...builder.root} {...rest} class={className}>
	{@render children?.()}
</GridRoot>
