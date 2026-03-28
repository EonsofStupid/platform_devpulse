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
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useDialog } from "$lib/design/behaviors/dialog/use-dialog.svelte.js";
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
	get open() {
		return controlledOpen ?? defaultOpen ?? false;
	},
	get closeOnEscape() {
		return !isKeyboardDismissDisabled;
	},
	get closeOnOutsideClick() {
		return isDismissible;
	},
	get preventScroll() {
		return preventScroll;
	},
	onOpenChange: (v) => onOpenChange?.({ open: v }),
});

setDialogContext({
	get hook() {
		return hook;
	},
	get ids() {
		return ids ?? {};
	},
	get dir() {
		return dir;
	},
	get size() {
		return size;
	},
});
</script>

{@render children?.()}
