<!--
	@component DialogTitle
	@kind dialog
	@slot title
	@layer components

	Title element with aria linking via adapter-generated ID.
	Spreads adapter title slot attrs ({ id }).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { getDialogContext } from "./context.js";
import type { DialogTitleProps } from "./types.js";

let { children, class: className, ...rest }: DialogTitleProps = $props();
const dialog = getDialogContext();
const recipe = getRecipe("dialog.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept any state
const titleClass = recipe?.classes?.({} as any)?.title ?? "";
</script>

<h2
	{...dialog.title}
	class={cn(titleClass, className)}
	data-kind="dialog"
	data-slot="title"
	{...rest}
>
	{@render children?.()}
</h2>
