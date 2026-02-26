<!--
	@component Code
	@kind code
	@layer components

	ColdLight Code — builder-driven code display component.
	Builder provides data attributes. Component adds recipe classes (inline/block styling).
	Block mode wraps <code> in <pre>. Inline mode renders bare <code>.
-->
<script lang="ts">
	import type { CodeComponentProps } from "./types.js";
	import { createCode } from "$lib/design/builders/code/index.js";
	import CodeRoot from "$lib/design/primitives/code/Code.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { codeRecipe } from "./recipe.js";

	let {
		inline = true,
		language,
		children,
		class: className,
		...rest
	}: CodeComponentProps = $props();

	const builder = createCode();
	const classes = $derived(cn(codeRecipe({ inline }), className));
</script>

{#if inline}
	<CodeRoot
		{...builder.root}
		{...rest}
		class={classes}
		data-language={language || undefined}
	>
		{@render children?.()}
	</CodeRoot>
{:else}
	<pre class={classes}><CodeRoot
		{...builder.root}
		{...rest}
		data-language={language || undefined}
	>{@render children?.()}</CodeRoot></pre>
{/if}
