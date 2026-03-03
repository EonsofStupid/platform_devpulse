<!--
	@component Label
	@kind label
	@layer components

	ARIA + state only. Builder-driven. ZERO visual.
	Native <label> element with `for` attribute association.
-->
<script lang="ts">
	import type { LabelComponentProps } from "./types.js";
	import { createLabel } from "$lib/design/api/adapters/coldlight/_internal/label/index.js";
	import LabelRoot from "$lib/design/primitives/label/Label.svelte";

	let {
		htmlFor,
		disabled = false,
		required = false,
		children,
		class: className,
		...rest
	}: LabelComponentProps = $props();

	const builder = createLabel({
		htmlFor: () => htmlFor,
		disabled: () => disabled,
	});
</script>

<LabelRoot {...builder.root} {...rest} class={className}>
	{@render children?.()}
	{#if required}
		<span class="text-ember-400 ml-0.5" aria-hidden="true">*</span>
	{/if}
</LabelRoot>
