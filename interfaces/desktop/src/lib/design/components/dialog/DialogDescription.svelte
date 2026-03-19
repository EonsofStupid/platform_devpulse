<!--
	@component DialogDescription
	@kind dialog
	@slot description
	@layer components

	Description paragraph with aria linking via adapter-generated ID.
	Spreads adapter description slot attrs ({ id }).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { getDialogContext } from "./context.js";
import type { DialogDescriptionProps } from "./types.js";

let { children, class: className, ...rest }: DialogDescriptionProps = $props();
const dialog = getDialogContext();
const recipe = getRecipe("dialog.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept any state
const descriptionClass = recipe?.classes?.({} as any)?.description ?? "";
</script>

<p
	{...dialog.description}
	class={cn(descriptionClass, className)}
	data-kind="dialog"
	data-slot="description"
	{...rest}
>
	{@render children?.()}
</p>
