<!--
	@component InlineCode
	@kind code
	@layer components

	Simple <code> span for inline code. Token-styled via centralized recipe.
	No Shiki — just a styled code element.
-->
<script lang="ts">
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { InlineCodeProps } from "./types.js";

let {
	id,
	dir = "ltr",
	children,
	class: className,
	...rest
}: InlineCodeProps = $props();

const recipe = getRecipe("code.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept resolved props
const recipeClasses = recipe?.classes?.({} as any) ?? {};
</script>

<code
	{id}
	{dir}
	data-kind="code"
	data-slot="inline"
	class={cn(recipeClasses.inline, className)}
	{...rest}
>{@render children?.()}</code>
