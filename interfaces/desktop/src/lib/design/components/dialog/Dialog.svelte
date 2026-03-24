<!--
	@component Dialog (Root)
	@kind dialog
	@layer components

	Modal overlay dialog. Uses useDialog() primitive hook for
	focus trap, scroll lock, dismiss, presence.
	Sets context for sub-components.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
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
