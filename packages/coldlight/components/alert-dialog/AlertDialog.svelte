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
import { useAlertDialog } from "#coldlight/behaviors/overlays/alert-dialog/use-alert-dialog.svelte.js";
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

const hook = $derived(
	useAlertDialog({
		open: controlledOpen ?? defaultOpen,
		onOpenChange: (v) => onOpenChange?.({ open: v }),
		onCancel,
		onAction,
	}),
);

setAlertDialogContext({
	get hook() {
		return hook;
	},
	get ids() {
		return ids ?? {};
	},
	get dir() {
		return dir;
	},
	get variant() {
		return variant;
	},
});
</script>

{@render children?.()}
