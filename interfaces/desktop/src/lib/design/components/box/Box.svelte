<!--
	@component Box
	@kind box
	@layer components

	ColdLight Box — builder-driven data attributes. ZERO visual.
	Keeps polymorphic `as` prop for semantic element choice.
-->
<script lang="ts">
	import type { BoxComponentProps } from "./types.js";
	import { createBox } from "$lib/design/api/adapters/coldlight/_internal/box/index.js";
	import BoxRoot from "$lib/design/primitives/box/Box.svelte";

	let { as = "div", children, class: className, ...rest }: BoxComponentProps = $props();

	const builder = createBox();
</script>

<BoxRoot {...builder.root} {...rest} {as} class={className}>
	{@render children?.()}
</BoxRoot>
