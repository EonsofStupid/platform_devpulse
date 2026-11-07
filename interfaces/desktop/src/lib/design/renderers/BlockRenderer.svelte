<!--
  @file BlockRenderer — Recursive Block Tree Renderer
  @layer renderers
  @package @devpulse/coldlight

  Takes a BlockNode and renders it using the recipe system for class resolution.
  Recursively renders slot children via svelte:self.
-->
<script lang="ts">
import type { BlockNode } from "$lib/design/blocks/schema.js";
import BlockRenderer from "./BlockRenderer.svelte";
import { resolveClasses } from "./resolveClasses.js";

let { node, depth = 0 }: { node: BlockNode; depth?: number } = $props();

const classes = $derived(resolveClasses(node));

/** Pick the primary slot class — prefers "root", then "content", then first available. */
const rootClass = $derived(classes.root ?? classes.content ?? Object.values(classes)[0] ?? "");

const slotEntries = $derived(node.slots ? Object.entries(node.slots) : []);
</script>

<div
	class={rootClass}
	data-kind={node.kind}
	data-slot="root"
	data-block-id={node.id}
	data-depth={depth}
>
	{#each slotEntries as [slotName, children]}
		{#each children as child (child.id)}
			<BlockRenderer node={child} depth={depth + 1} />
		{/each}
	{/each}
</div>
