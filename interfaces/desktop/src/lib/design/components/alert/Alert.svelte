<!--
	@component Alert
	@kind alert
	@layer components

	ColdLight Alert — builder-driven component.
	Builder owns ALL ARIA semantics. Component adds recipe classes.
	Reference: WAI-ARIA APG Alert Pattern
-->
<script lang="ts">
	import type { AlertComponentProps } from "./types.js";
	import { createAlert } from "$lib/design/builders/alert/index.js";
	import AlertRoot from "$lib/design/primitives/alert/Alert.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { alertRecipe } from "./recipe.js";

	let {
		intent = "info",
		closable = false,
		onClose,
		children,
		class: className,
		...rest
	}: AlertComponentProps = $props();

	const builder = createAlert({
		onVisibleChange: (visible) => {
			if (!visible) onClose?.();
		},
	});

	const classes = $derived(cn(alertRecipe({ intent }), className));
</script>

<AlertRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
	{#if closable}
		<button
			{...builder.action}
			type="button"
			class="absolute top-2 right-2 inline-flex items-center justify-center rounded-sm p-1 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
			aria-label="Close alert"
			data-slot="action"
		>
			<span aria-hidden="true">&times;</span>
		</button>
	{/if}
</AlertRoot>
