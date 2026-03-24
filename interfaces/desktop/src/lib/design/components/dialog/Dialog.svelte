<!--
	@component Dialog
	@kind dialog
	@layer component
	@category structural
	@description Modal overlay window for focused tasks, confirmations, or complex form input
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
	@container true
	@containerSlots content, footer
	@compound true
	@blockCategory layout
	@defaultStyle dialog-default
	@styleIds dialog-default
	@requiredAxes backgroundColor, shadow, borderRadius, border
	@slots root:all, overlay:none, content:none, header:none, body:none, footer:none, close:none
-->
<script lang="ts">
import { useDialog } from "$lib/design/primitives/dialog/use-dialog.svelte.js";
import { setDialogContext } from "./context.js";
import type { DialogRootProps } from "./types.js";

let {
	ids,
	open: controlledOpen,
	defaultOpen,
	onOpenChange,
	size = "md",
	isDismissible = true,
	isKeyboardDismissDisabled = false,
	preventScroll = true,
	dir = "ltr",
	onExitComplete,
	children,
}: DialogRootProps = $props();

const hook = useDialog({
	get open() { return controlledOpen ?? defaultOpen ?? false; },
	get closeOnEscape() { return !isKeyboardDismissDisabled; },
	get closeOnOutsideClick() { return isDismissible; },
	get preventScroll() { return preventScroll; },
	onOpenChange: (v) => onOpenChange?.({ open: v }),
});

setDialogContext({
	get hook() { return hook; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get size() { return size; },
});
</script>

{@render children?.()}
