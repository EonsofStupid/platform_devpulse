<!--
	@component InlineMessage
	@kind inline-message
	@layer components

	ColdLight InlineMessage — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/inline-message/.
-->
<script lang="ts">
	import type { InlineMessageComponentProps } from "./types.js";
	import { createInlineMessage } from "$lib/design/api/adapters/coldlight/_internal/inline-message/index.js";
	import InlineMessageRoot from "$lib/design/primitives/inline-message/InlineMessage.svelte";

	let {
		// Kind-specific props
		tone = "info",
		children,
		class: className,
		// Rest spread
		...rest
	}: InlineMessageComponentProps = $props();

	const builder = createInlineMessage();
</script>

<InlineMessageRoot
	{...builder.root}
	{...rest}
	class={className}
	data-state={tone}
>
	{@render children?.()}
</InlineMessageRoot>
