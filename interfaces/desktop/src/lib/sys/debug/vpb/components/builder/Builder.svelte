<!--
  @file src/lib/sys/debug/vpb/components/builder/Builder.svelte
  @description VPB Builder - Block palette and tree composition

  ColdLight molecules + token vars for styling.
  Consumes taxonomy/kinds for palette generation.

  @since 1.0.0
-->
<script lang="ts">
import { vpb } from "../../state/vpb.svelte";
import { type PaletteCategoryGroup, type PaletteItem, paletteGroups } from "./palette";
import type { BlockNode } from "./schema";

// Local state for collapsed categories
let collapsedCategories = $state<Set<string>>(new Set());
let searchQuery = $state("");

// Filtered palette items
let filteredGroups = $derived(() => {
	if (!searchQuery.trim()) return paletteGroups;
	const q = searchQuery.toLowerCase();
	return paletteGroups
		.map((group) => ({
			...group,
			items: group.items.filter(
				(item) =>
					item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
			),
		}))
		.filter((group) => group.items.length > 0);
});

// Toggle category collapse
function toggleCategory(id: string) {
	if (collapsedCategories.has(id)) {
		collapsedCategories.delete(id);
	} else {
		collapsedCategories.add(id);
	}
	collapsedCategories = new Set(collapsedCategories);
}

// Add block from palette
function addBlockFromPalette(item: PaletteItem) {
	// If there's a selected block, add as child to first slot
	if (vpb.selectedBlock) {
		const slots = vpb.selectedBlock.slots;
		const firstSlot = slots ? Object.keys(slots)[0] : null;
		if (firstSlot) {
			vpb.addBlock(item.kind, vpb.selectedBlock.id, firstSlot, item.defaultRecipe);
			return;
		}
	}
	// Otherwise add to root
	vpb.addBlock(item.kind, null, "root", item.defaultRecipe);
}

// Start drag from palette
function handleDragStart(e: DragEvent, item: PaletteItem) {
	if (!e.dataTransfer) return;
	e.dataTransfer.effectAllowed = "copy";
	e.dataTransfer.setData("text/plain", item.kind);
	vpb.startDragFromPalette(item.kind);
}

function handleDragEnd() {
	vpb.cancelDrag();
}

// Recursive block tree renderer
function getBlockChildren(block: BlockNode): Array<{ slot: string; children: BlockNode[] }> {
	if (!block.slots) return [];
	const result: Array<{ slot: string; children: BlockNode[] }> = [];
	for (const [slot, children] of Object.entries(block.slots)) {
		if (children && children.length > 0) {
			result.push({ slot, children });
		}
	}
	return result;
}
</script>

<div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <div class="w-2 h-2 rounded-full bg-[var(--color-purple-400)]"></div>
        <h3 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex-1">
            Builder
        </h3>
        <span class="text-xs text-[var(--text-muted)]">{vpb.tree.length} blocks</span>
    </div>

    <!-- Search -->
    <div class="px-3 py-2 border-b border-white/5">
        <input
            type="text"
            placeholder="Search blocks..."
            class="bg-matte-dark border border-white/8 w-full px-2 py-1 text-xs rounded text-[var(--text-primary)]"
            bind:value={searchQuery}
        />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
        <!-- Block Palette -->
        <div class="p-2">
            <div class="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-2 py-1">
                Palette
            </div>
            {#each filteredGroups() as group (group.id)}
                <div class="mb-2">
                    <!-- Category Header -->
                    <button
                        class="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-white/5 rounded transition-colors"
                        onclick={() => toggleCategory(group.id)}
                    >
                        <span class="text-[var(--text-muted)] transition-transform" class:rotate-90={!collapsedCategories.has(group.id)}>
                            ▶
                        </span>
                        <span class="flex-1 text-left">{group.label}</span>
                        <span class="text-[var(--text-muted)]">{group.items.length}</span>
                    </button>

                    <!-- Category Items -->
                    {#if !collapsedCategories.has(group.id)}
                        <div class="grid grid-cols-2 gap-1 px-1 mt-1">
                            {#each group.items as item (item.kind)}
                                <button
                                    class="bg-matte-dark border border-white/8 flex items-center gap-2 px-2 py-1.5 text-left rounded text-xs transition-all hover:scale-[1.02] hover:bg-white/5"
                                    draggable="true"
                                    ondragstart={(e) => handleDragStart(e, item)}
                                    ondragend={handleDragEnd}
                                    onclick={() => addBlockFromPalette(item)}
                                    title={item.description}
                                >
                                    <span class="text-[var(--text-muted)] text-[10px]">
                                        {#if item.layoutMode === "grid"}
                                            ⊞
                                        {:else if item.layoutMode === "flex"}
                                            ⊟
                                        {:else}
                                            ◻
                                        {/if}
                                    </span>
                                    <span class="truncate">{item.label}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <!-- Block Tree -->
        {#if vpb.tree.length > 0}
            <div class="p-2 border-t border-white/5">
                <div class="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                    <span>Tree</span>
                    <button
                        class="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        onclick={() => vpb.clearTree()}
                    >
                        Clear
                    </button>
                </div>
                <div class="space-y-1">
                    {#each vpb.tree as block (block.id)}
                        {@render blockTreeItem(block, 0)}
                    {/each}
                </div>
            </div>
        {/if}
    </div>

    <!-- Footer Actions -->
    <div class="flex items-center gap-1 px-3 py-2 border-t border-white/5">
        <button
            class="bg-matte-dark border border-white/8 flex-1 px-2 py-1 text-xs rounded hover:bg-white/5 text-[var(--text-secondary)]"
            onclick={() => vpb.undo()}
            disabled={!vpb.canUndo}
            class:opacity-50={!vpb.canUndo}
        >
            Undo
        </button>
        <button
            class="bg-matte-dark border border-white/8 flex-1 px-2 py-1 text-xs rounded hover:bg-white/5 text-[var(--text-secondary)]"
            onclick={() => vpb.redo()}
            disabled={!vpb.canRedo}
            class:opacity-50={!vpb.canRedo}
        >
            Redo
        </button>
    </div>
</div>

{#snippet blockTreeItem(block: BlockNode, depth: number)}
    <div style="padding-left: {depth * 12}px">
        <button
            class="bg-matte-dark border border-white/8 w-full flex items-center gap-2 px-2 py-1.5 text-left rounded text-xs transition-all hover:bg-white/5 {vpb.selection.blockId === block.id ? 'bg-[var(--surface-elevated)]' : ''}"
            onclick={() => vpb.select(block.id)}
        >
            <span class="text-[var(--text-muted)] text-[10px]">
                {#if block.slots && Object.keys(block.slots).some(k => block.slots?.[k]?.length)}
                    ▼
                {:else}
                    ◻
                {/if}
            </span>
            <span class="flex-1 truncate">{block.kind}</span>
            <span class="text-[var(--text-muted)] text-[10px] truncate max-w-[60px]">{block.recipe.split('.').pop()}</span>
        </button>

        <!-- Render children -->
        {#each getBlockChildren(block) as { slot, children }}
            <div style="padding-left: {(depth + 1) * 12}px" class="text-[10px] text-[var(--text-muted)] px-2 py-0.5">
                {slot}
            </div>
            {#each children as child (child.id)}
                {@render blockTreeItem(child, depth + 2)}
            {/each}
        {/each}
    </div>
{/snippet}
