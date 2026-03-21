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
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { setDialogContext } from "./context.js";
import type { DialogRootProps } from "./types.js";

let {
	ids,
	open: controlledOpen,
	defaultOpen = false,
	onOpenChange,
	size = "md",
	isDismissible = true,
	isKeyboardDismissDisabled = false,
	preventScroll = true,
	dir = "ltr",
	onExitComplete,
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
}: DialogRootProps = $props();

const hook = useDialog({
	open: controlledOpen ?? defaultOpen,
	closeOnEscape: !isKeyboardDismissDisabled,
	closeOnOutsideClick: isDismissible,
	preventScroll,
	onOpenChange: (v) => onOpenChange?.({ open: v }),
});

const recipe = getRecipe("dialog.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept resolved props
const recipeClasses = $derived(recipe?.classes?.({} as any) ?? {});

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

setDialogContext({
	get hook() { return hook; },
	get classes() { return recipeClasses; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get size() { return size; },
});
</script>

{@render children?.()}
