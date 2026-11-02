<!-- @component TreeItem @kind tree @slot item -->
<script lang="ts">
import { ChevronDown, ChevronRight } from "lucide-svelte";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { childLevel, getTreeContext } from "./context.js";
import type { TreeItemProps } from "./types.js";

let { value, label, disabled = false, children, icon, class: className }: TreeItemProps = $props();
const context = getTreeContext();
const level = childLevel();
const attrs = $derived(
	context.behavior.getItem(value, { hasChildren: !!children, level, disabled }),
);
</script>

<div {...attrs} {...styleAttrs({ kind: "tree", variant: context.variant })} aria-label={label} class={cn(className)}>
	<div data-kind="tree" data-slot="row" class="flex items-center gap-2">
		{#if children}
			<span data-kind="tree" data-slot="indicator" class="inline-flex shrink-0" aria-hidden="true">
				{#if attrs["aria-expanded"]}<ChevronDown size="1em" />{:else}<ChevronRight size="1em" />{/if}
			</span>
		{/if}
		{#if icon}<span aria-hidden="true" class="inline-flex shrink-0">{@render icon()}</span>{/if}
		<span>{label}</span>
	</div>
	{#if children}
		<div {...context.behavior.getGroup()} hidden={!attrs["aria-expanded"]}>
			{@render children()}
		</div>
	{/if}
</div>
