<!--
	@component Heading
	@kind heading
	@layer components

	ColdLight Heading — builder-driven ARIA + state. ZERO visual.
	Builder owns role="heading" + aria-level + ALL data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/heading/.

	Usage (from ui/ layer):
	  <Heading {level} class={computedClasses} />
-->
<script lang="ts">
	import type { HeadingComponentProps } from "./types.js";
	import { createHeading } from "$lib/design/api/adapters/coldlight/_internal/heading/index.js";
	import HeadingRoot from "$lib/design/primitives/heading/Heading.svelte";

	let {
		level = 2,
		children,
		class: className,
		...rest
	}: HeadingComponentProps = $props();

	// Builder owns ARIA (role="heading", aria-level), data attributes
	const builder = createHeading({ level: () => level });
</script>

<HeadingRoot {...builder.root} {...rest} {level} class={className}>
	{@render children?.()}
</HeadingRoot>
