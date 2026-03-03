<!--
	@component Callout
	@kind callout
	@layer components

	ColdLight Callout — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, keyboard, data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/callout/.
-->
<script lang="ts">
	import type { CalloutComponentProps } from "./types.js";
	import { createCallout } from "$lib/design/api/adapters/coldlight/_internal/callout/index.js";
	import CalloutRoot from "$lib/design/primitives/callout/Callout.svelte";

	let {
		variant = "info",
		children,
		class: className,
		...rest
	}: CalloutComponentProps = $props();

	// Builder owns ARIA, keyboard, state
	const builder = createCallout();
</script>

<CalloutRoot {...builder.root} {...rest} class={className} data-state={variant}>
	{@render children?.()}
</CalloutRoot>
