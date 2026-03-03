<!--
	@component Separator
	@kind separator
	@layer components

	ColdLight Separator — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA (role, aria-orientation, aria-hidden).
	Visual (recipe, ColdLight encoding, variant) applied by ui/separator/.
-->
<script lang="ts">
	import type { SeparatorComponentProps } from "./types.js";
	import { createSeparator } from "$lib/design/api/adapters/coldlight/_internal/separator/index.js";
	import SeparatorRoot from "$lib/design/primitives/separator/Separator.svelte";

	let {
		orientation = "horizontal",
		decorative = false,
		class: className,
		...rest
	}: SeparatorComponentProps = $props();

	const builder = createSeparator({
		get orientation() { return orientation; },
		get decorative() { return decorative; },
	});
</script>

<SeparatorRoot
	{...builder.root}
	{...rest}
	class={className}
/>
