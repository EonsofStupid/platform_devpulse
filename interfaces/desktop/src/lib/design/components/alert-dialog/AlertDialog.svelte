<!--
	@component AlertDialog (Root)
	@kind alert-dialog
	@layer components

	Confirmation/destructive action dialog. role="alertdialog".
	Uses useAlertDialog() primitive hook.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
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

const recipeClasses = $derived(recipe?.classes?.({} as any) ?? {});

setAlertDialogContext({
	get hook() { return hook; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get variant() { return variant; },
});
</script>

{@render children?.()}
