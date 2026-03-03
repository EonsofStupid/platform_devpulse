<!--
	@component Button
	@kind button
	@layer components

	ColdLight Button — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, keyboard, data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/button/.

	Usage (from ui/ layer):
	  <Button {disabled} {pressed} {loading} class={computedClasses} />
-->
<script lang="ts">
	import type { ButtonComponentProps } from "./types.js";
	import { createButton } from "$lib/design/api/adapters/coldlight/_internal/button/index.js";
	import ButtonRoot from "$lib/design/primitives/button/Button.svelte";

	let {
		pressed,
		onPressedChange,
		loading = false,
		disabled = false,
		expanded,
		type,
		children,
		class: className,
		...rest
	}: ButtonComponentProps = $props();

	// Builder owns ARIA, keyboard, state
	const builder = createButton({
		disabled: () => disabled,
		pressed: () => pressed,
		loading: () => loading,
		expanded: () => expanded,
		type: () => type,
		onPressedChange: (v) => onPressedChange?.(v),
	});
</script>

<ButtonRoot {...builder.root} {...rest} class={className}>
	{@render children?.()}
</ButtonRoot>
