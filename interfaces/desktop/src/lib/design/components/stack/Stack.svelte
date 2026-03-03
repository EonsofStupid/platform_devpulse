<!--
	@component Stack
	@kind stack
	@layer components

	ColdLight Stack — builder-driven data attributes. ZERO visual.
-->
<script lang="ts">
	import type { StackComponentProps } from "./types.js";
	import { createStack } from "$lib/design/api/adapters/coldlight/_internal/stack/index.js";
	import StackRoot from "$lib/design/primitives/stack/Stack.svelte";

	let { children, class: className, ...rest }: StackComponentProps = $props();

	const builder = createStack();
</script>

<StackRoot {...builder.root} {...rest} class={className}>
	{@render children?.()}
</StackRoot>
