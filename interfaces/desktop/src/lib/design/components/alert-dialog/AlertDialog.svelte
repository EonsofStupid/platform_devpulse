<!--
	@component Alert Dialog
	@kind alert-dialog
	@layer component
	@category feedback
	@description Modal dialog requiring user acknowledgment before proceeding with a destructive or critical action
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
	@container true
	@containerSlots content, footer
	@compound true
	@blockCategory feedback
	@defaultStyle alert-dialog-default
	@styleIds alert-dialog-default
	@requiredAxes backgroundColor, shadow, borderRadius, border
	@slots root:all, overlay:none, content:none, title:none, description:none, footer:none
-->
<script lang="ts">
import { useAlertDialog } from "$lib/design/primitives/alert-dialog/use-alert-dialog.svelte.js";
import { setAlertDialogContext } from "./context.js";
import type { AlertDialogRootProps } from "./types.js";

let {
	ids,
	open: controlledOpen,
	defaultOpen = false,
	onOpenChange,
	variant = "confirmation",
	size = "md",
	dir = "ltr",
	onCancel,
	onAction,
	children,
}: AlertDialogRootProps = $props();

const hook = useAlertDialog({
	open: controlledOpen ?? defaultOpen,
	onOpenChange: (v) => onOpenChange?.({ open: v }),
	onCancel,
	onAction,
});

setAlertDialogContext({
	get hook() { return hook; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get variant() { return variant; },
});
</script>

{@render children?.()}
