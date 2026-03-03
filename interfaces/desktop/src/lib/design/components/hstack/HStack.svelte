<!--
	@component HStack
	@kind hstack
	@layer components

	ColdLight HStack — builder-driven data attributes. ZERO visual.
-->
<script lang="ts">
	import type { HStackComponentProps } from "./types.js";
	import { createHStack } from "$lib/design/api/adapters/coldlight/_internal/hstack/index.js";
	import HStackRoot from "$lib/design/primitives/hstack/HStack.svelte";

	let { children, class: className, ...rest }: HStackComponentProps = $props();

	const builder = createHStack();
</script>

<HStackRoot {...builder.root} {...rest} class={className}>
	{@render children?.()}
</HStackRoot>
