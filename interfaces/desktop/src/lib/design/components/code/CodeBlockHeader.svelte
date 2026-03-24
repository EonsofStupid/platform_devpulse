<!--
	@component CodeBlock.Header
	@kind code
	@slot header
	@layer components

	Filename / language label bar. Auto-renders filename and language
	from Root context if no children provided.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCodeBlockContext } from "./context.js";
import type { CodeBlockHeaderProps } from "./types.js";

let { children, element, class: className, ...rest }: CodeBlockHeaderProps = $props();
const ctx = getCodeBlockContext();

const attrs = $derived({
	id: ctx.ids.header,
	"data-kind": "code" as const,
	"data-slot": "header" as const,
	class: cn(className),
	...rest,
});
</script>

{#if element}
	{@render element(attrs)}
{:else}
	<div {...attrs}>
		{#if children}
			{@render children()}
		{:else}
			{#if ctx.filename}
				<span data-slot="filename">{ctx.filename}</span>
			{/if}
			{#if ctx.language}
				<span data-slot="language">{ctx.language}</span>
			{/if}
		{/if}
	</div>
{/if}
