<!--
	@component CodeBlock.CopyButton
	@kind code
	@slot copyButton
	@layer components

	Copies code to clipboard. Uses context copyCode handler.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getCodeBlockContext } from "./context.js";
import type { CodeBlockCopyButtonProps } from "./types.js";

let { value, children, element, class: className, ...rest }: CodeBlockCopyButtonProps = $props();
const ctx = getCodeBlockContext();

const attrs = $derived({
	id: ctx.ids.copyButton,
	"data-kind": "code" as const,
	"data-slot": "copy-button" as const,
	class: cn(className),
	...rest,
});

function handleClick() {
	ctx.copyCode(value);
}
</script>

{#if element}
	{@render element(attrs)}
{:else}
	<button
		type="button"
		disabled={ctx.disabled}
		aria-label="Copy code"
		onclick={handleClick}
		{...attrs}
	>
		{#if children}
			{@render children()}
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-3xs"
				aria-hidden="true"
			>
				<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
				<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
			</svg>
		{/if}
	</button>
{/if}
