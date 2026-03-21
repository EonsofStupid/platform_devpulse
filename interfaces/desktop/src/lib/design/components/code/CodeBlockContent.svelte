<!--
	@component CodeBlock.Content
	@kind code
	@slot content
	@layer components

	The <pre><code> area. Two modes:
	  1. Pass `code` prop — renders as plain text
	  2. Pass children — consumer controls rendering (Shiki HTML, etc.)
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCodeBlockContext } from "./context.js";
import type { CodeBlockContentProps } from "./types.js";

let { code, children, element, class: className, ...rest }: CodeBlockContentProps = $props();
const ctx = getCodeBlockContext();

const attrs = $derived({
	id: ctx.ids.content,
	"data-kind": "code" as const,
	"data-slot": "content" as const,
	class: cn(ctx.classes.content, className),
	...rest,
});
</script>

{#if element}
	{@render element(attrs)}
{:else}
	<pre {...attrs}><code data-language={ctx.language || undefined}>{#if children}{@render children()}{:else if code}{code}{/if}</code></pre>
{/if}
