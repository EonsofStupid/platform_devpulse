<!--
	@component Container
	@kind container
	@layer components

	ColdLight Container — builder-driven data attributes. ZERO visual.
-->
<script lang="ts">
	import type { ContainerComponentProps } from "./types.js";
	import { createContainer } from "$lib/design/api/adapters/coldlight/_internal/container/index.js";
	import ContainerRoot from "$lib/design/primitives/container/Container.svelte";

	let { children, class: className, ...rest }: ContainerComponentProps = $props();

	const builder = createContainer();
</script>

<ContainerRoot {...builder.root} {...rest} class={className}>
	{@render children?.()}
</ContainerRoot>
