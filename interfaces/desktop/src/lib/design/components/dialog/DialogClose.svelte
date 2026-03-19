<!--
	@component DialogClose
	@kind dialog
	@slot close
	@layer components

	Close button that dismisses the dialog.
	Spreads adapter close slot attrs (type, onclick).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { getDialogContext } from "./context.js";
import type { DialogCloseProps } from "./types.js";

let { children, class: className, ...rest }: DialogCloseProps = $props();
const dialog = getDialogContext();
const recipe = getRecipe("dialog.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept any state
const closeClass = recipe?.classes?.({} as any)?.close ?? "";
</script>

<button
	{...dialog.close}
	class={cn(closeClass, className)}
	data-kind="dialog"
	data-slot="close"
	{...rest}
>
	{@render children?.()}
</button>
