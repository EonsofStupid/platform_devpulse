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
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
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
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	children,
}: AlertDialogRootProps = $props();

const hook = useAlertDialog({
	open: controlledOpen ?? defaultOpen,
	onOpenChange: (v) => onOpenChange?.({ open: v }),
	onCancel,
	onAction,
});

const recipe = getRecipe("dialog.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept resolved props
const recipeClasses = recipe?.classes?.({} as any) ?? {};

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius: radius ?? "lg",
}));

setAlertDialogContext({
	get hook() { return hook; },
	get classes() { return recipeClasses; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get variant() { return variant; },
});
</script>

{@render children?.()}
