<!--
	@component DialogDescription
	@kind dialog
	@slot description
	@layer components

	Description paragraph with aria linking via adapter-generated ID.
	Spreads adapter description slot attrs ({ id }).
-->
<script lang="ts">
	import type { DialogDescriptionProps } from "./types.js";
	import { getDialogContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { getRecipe } from "$lib/design/recipes/index.js";

	let { children, class: className, ...rest }: DialogDescriptionProps = $props();
	const dialog = getDialogContext();
	const recipe = getRecipe("dialog.glass.void");
	const descriptionClass = recipe?.classes({} as any)?.description ?? "";
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
