<!--
	@component Spinner
	@kind spinner
	@layer components

	ColdLight Spinner — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, keyboard, data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/spinner/.

	Usage (from ui/ layer):
	  <Spinner {active} {onActiveChange} class={computedClasses} />
-->
<script lang="ts">
	import type { SpinnerComponentProps } from "./types.js";
	import { createSpinner } from "$lib/design/api/adapters/coldlight/_internal/spinner/index.js";
	import SpinnerRoot from "$lib/design/primitives/spinner/Spinner.svelte";

	let {
		active = true,
		onActiveChange,
		class: className,
		...rest
	}: SpinnerComponentProps = $props();

	// Builder owns ARIA, keyboard, state
	const builder = createSpinner({
		active: () => active,
		onActiveChange: (v: boolean) => onActiveChange?.(v),
	});
</script>

<SpinnerRoot {...builder.root} {...rest} class={className} />
