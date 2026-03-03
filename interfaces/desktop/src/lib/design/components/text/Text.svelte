<!--
	@component Text
	@kind text
	@layer components

	ColdLight Text — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/text/.

	Usage (from ui/ layer):
	  <Text {as} class={computedClasses} />
-->
<script lang="ts">
	import type { TextComponentProps } from "./types.js";
	import { createText } from "$lib/design/api/adapters/coldlight/_internal/text/index.js";
	import TextRoot from "$lib/design/primitives/text/Text.svelte";

	let {
		as = "span",
		children,
		class: className,
		...rest
	}: TextComponentProps = $props();

	// Builder owns data attributes
	const builder = createText({ as: () => as });
</script>

<TextRoot {...builder.root} {...rest} {as} class={className}>
	{@render children?.()}
</TextRoot>
