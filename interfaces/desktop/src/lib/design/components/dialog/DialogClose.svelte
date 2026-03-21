<!--
	@component Dialog.Close
	@kind dialog
	@slot close
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDialogContext } from "./context.js";
import type { DialogCloseProps } from "./types.js";

let { children, class: className, ...rest }: DialogCloseProps = $props();
const ctx = getDialogContext();
</script>

<button
	{...ctx.hook.close}
	id={ctx.ids.close}
	class={cn(ctx.classes.close, className)}
	{...rest}
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
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	{/if}
</button>
