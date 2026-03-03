<!--
	@component Kbd
	@kind kbd
	@layer components

	ColdLight Kbd — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/kbd/.
-->
<script lang="ts">
	import type { KbdComponentProps } from "./types.js";
	import { createKbd } from "$lib/design/api/adapters/coldlight/_internal/kbd/index.js";
	import KbdRoot from "$lib/design/primitives/kbd/Kbd.svelte";

	let {
		// Kind-specific props
		size = "md",
		children,
		class: className,
		// Rest spread
		...rest
	}: KbdComponentProps = $props();

	const builder = createKbd();
</script>

<KbdRoot
	{...builder.root}
	{...rest}
	class={className}
>
	{@render children?.()}
</KbdRoot>
