<!--
	@component Alert
	@kind alert
	@layer components

	ColdLight Alert — wraps structureless Alert primitive with:
	- ARIA attributes (role="alert", implicit aria-live="assertive")
	- State derivation (data-state based on intent)
	- SD5 token-driven recipe (intent)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Alert Pattern
-->
<script lang="ts">
	import type { AlertComponentProps } from "./types.js";
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

	const classes = $derived(cn(alertRecipe({ intent }), className));

	const dataState = $derived(intent);
</script>

<AlertRoot
	{...rest}
	class={classes}
	role="alert"
	data-state={dataState}
>
	{@render children?.()}
	{#if closable}
		<button
			type="button"
			class="absolute top-2 right-2 inline-flex items-center justify-center rounded-sm p-1 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
			aria-label="Close alert"
			onclick={onClose}
			data-slot="action"
		>
			<span aria-hidden="true">&times;</span>
		</button>
	{/if}
</AlertRoot>
