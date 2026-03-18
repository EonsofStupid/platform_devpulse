<!--
	@component CollapsibleContent
	@kind collapsible
	@layer components

	Collapsible content area — conditionally rendered when open.
	Reads transport context for slot attributes.

	Only rendered when transport.states.open is true.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getCollapsibleContext } from "./context.js";
import { collapsibleRecipe } from "./recipe.js";
import type { CollapsibleContentProps } from "./types.js";

let { children, class: className, ...rest }: CollapsibleContentProps = $props();

const transport = getCollapsibleContext();
const recipe = collapsibleRecipe();
</script>

{#if transport.states.open}
	<div
		{...transport.slots.content}
		class={cn(recipe.content, className)}
		data-kind="collapsible"
		data-slot="content"
		data-state="open"
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
