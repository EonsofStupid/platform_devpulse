<!--
	@component Code
	@kind code
	@layer components

	ColdLight Code — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/code/.
-->
<script lang="ts">
	import type { CodeComponentProps } from "./types.js";
	import { createCode } from "$lib/design/api/adapters/coldlight/_internal/code/index.js";
	import CodeRoot from "$lib/design/primitives/code/Code.svelte";

	let {
		// Kind-specific props
		inline = true,
		language,
		children,
		class: className,
		// Rest spread
		...rest
	}: CodeComponentProps = $props();

	const builder = createCode();
</script>

{#if inline}
	<CodeRoot
		{...builder.root}
		{...rest}
		class={className}
		data-language={language || undefined}
	>
		{@render children?.()}
	</CodeRoot>
{:else}
	<pre class={className}><CodeRoot
		{...builder.root}
		{...rest}
		data-language={language || undefined}
	>{@render children?.()}</CodeRoot></pre>
{/if}
