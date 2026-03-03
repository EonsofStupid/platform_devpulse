<!--
	@component Card
	@kind card
	@layer components

	ColdLight Card — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, data attributes.
	Visual (recipe, ColdLight encoding, variant) applied by ui/card/.
-->
<script lang="ts">
	import type { CardComponentProps } from "./types.js";
	import { createCard } from "$lib/design/api/adapters/coldlight/_internal/card/index.js";
	import CardRoot from "$lib/design/primitives/card/Card.svelte";

	let {
		label,
		labelledBy,
		children,
		class: className,
		...rest
	}: CardComponentProps = $props();

	const builder = createCard({
		label: () => label,
		labelledBy: () => labelledBy,
	});
</script>

<CardRoot
	{...builder.root}
	{...rest}
	class={className}
>
	{@render children?.()}
</CardRoot>
