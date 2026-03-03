<!--
	@component Alert
	@kind alert
	@layer components

	ColdLight Alert — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, keyboard, data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/alert/.

	Usage (from ui/ layer):
	  <Alert {closable} {onClose} class={computedClasses} />
-->
<script lang="ts">
	import type { AlertComponentProps } from "./types.js";
	import { createAlert } from "$lib/design/api/adapters/coldlight/_internal/alert/index.js";
	import AlertRoot from "$lib/design/primitives/alert/Alert.svelte";

	let {
		closable = false,
		onClose,
		children,
		class: className,
		...rest
	}: AlertComponentProps = $props();

	// Builder owns ARIA, keyboard, state
	const builder = createAlert({
		onVisibleChange: (visible) => {
			if (!visible) onClose?.();
		},
	});
</script>

<AlertRoot {...builder.root} {...rest} class={className}>
	{@render children?.()}
	{#if closable}
		<button
			{...builder.action}
			type="button"
			class="absolute top-2 right-2 inline-flex items-center justify-center rounded-sm p-1 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
			aria-label="Close alert"
			data-slot="action"
		>
			<span aria-hidden="true">&times;</span>
		</button>
	{/if}
</AlertRoot>
