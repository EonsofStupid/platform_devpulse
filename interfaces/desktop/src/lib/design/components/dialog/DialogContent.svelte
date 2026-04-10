<!--
	@component Dialog.Content
	@kind dialog
	@slot content
	@layer components

	Native <dialog> element. showModal() for focus trap + top-layer.
-->
<script lang="ts">
import { dialogAnatomy } from "$lib/design/behaviors/overlays/dialog/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { getDialogContext } from "./context.js";
import type { DialogContentProps } from "./types.js";

let { children, class: className, ...rest }: DialogContentProps = $props();
const ctx = getDialogContext();
const m = $derived(renderForge({ kind: "dialog", preset: "default" }));

const SIZE_CLASSES: Record<string, string> = {
	sm: "max-w-[var(--size-container-xs)]",
	md: "max-w-[var(--size-container-sm)]",
	lg: "max-w-[var(--size-container-md)]",
	xl: "max-w-[var(--size-container-lg)]",
	fullscreen: "max-w-none w-full h-full",
};
</script>

{#if ctx.hook.open}
		<dialog
			{...dialogAnatomy.attrs.content}
			{...ctx.hook.content}
			use:ctx.hook.attachContent
			id={ctx.ids.content}
			{...m.dataAttrs}
			style={cssVarString(m.cssVars)}
			class={cn(SIZE_CLASSES[ctx.size] ?? SIZE_CLASSES.md, className)}
			{...rest}
			open
		>
			{@render children?.()}
		</dialog>
{/if}
