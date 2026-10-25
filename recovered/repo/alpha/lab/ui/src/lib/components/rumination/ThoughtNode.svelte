<script lang="ts">
	import type { ThoughtNode as TNode } from '$lib/api/rumination';
	import ThoughtNode from './ThoughtNode.svelte';

	interface Props {
		node: TNode;
		isSelected?: boolean;
		depth?: number;
	}

	let { node, isSelected = false, depth = 0 }: Props = $props();

	const maxDepth = 5;
	const indent = $derived(Math.min(depth, maxDepth) * 16);
</script>

<div class="tree-line" style="margin-left: {indent}px">
	<div
		class="glass p-3 mb-2 transition-all {isSelected
			? 'border-accent-amber bg-amber-500/10'
			: 'glass-hover'}"
	>
		<div class="flex items-start justify-between gap-2">
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<span class="text-xs text-gray-500">{node.source}</span>
					{#if node.score > 0}
						<span class="text-xs text-accent-green">{(node.score * 100).toFixed(0)}%</span>
					{/if}
				</div>
				<p class="text-sm text-gray-300 line-clamp-3">{node.content}</p>
			</div>
		</div>
	</div>

	{#if node.children && node.children.length > 0}
		{#each node.children as child (child.id)}
			<ThoughtNode node={child} depth={depth + 1} isSelected={false} />
		{/each}
	{/if}
</div>
