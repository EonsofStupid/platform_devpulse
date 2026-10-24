<!--
	@component Dialog.Content
	@kind dialog
	@slot content
	@layer components

	Native <dialog> element. showModal() for focus trap + top-layer.
-->
<script lang="ts">
import { dialogAnatomy } from "#coldlight/behaviors/overlays/dialog/index.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { getDialogContext } from "./context.js";
import { DIALOG_DEFAULTS } from "./dialog.generated.js";
import type { DialogContentProps } from "./types.js";

let {
	variant = DIALOG_DEFAULTS.variant,
	surface,
	children,
	class: className,
	...rest
}: DialogContentProps = $props();
const ctx = getDialogContext();

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
			{...rest}
			{...styleAttrs({ kind: "dialog", variant, surface })}
			class={cn(SIZE_CLASSES[ctx.size] ?? SIZE_CLASSES.md, className)}
			open
		>
			{@render children?.()}
		</dialog>
{/if}
