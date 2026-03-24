<!--
	@component Dialog.Content
	@kind dialog
	@slot content
	@layer components

	Native <dialog> element. showModal() for focus trap + top-layer.
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { getDialogContext } from "./context.js";
import type { DialogContentProps } from "./types.js";

let { children, class: className, ...rest }: DialogContentProps = $props();
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
	<StyleMacro kind="dialog" style="dialog-default">
		<dialog
			{...ctx.hook.content}
			use:ctx.hook.attachContent
			id={ctx.ids.content}
			data-kind="dialog"
			data-slot="content"
			class={cn(SIZE_CLASSES[ctx.size] ?? SIZE_CLASSES.md, className)}
			{...rest}
			open
		>
			{@render children?.()}
		</dialog>
	</StyleMacro>
{/if}
