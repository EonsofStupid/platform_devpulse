<!--
  @file src/lib/sys/debug/vpb/components/builder/Builder.svelte
  @description VPB Builder - Block palette and tree composition

  ColdLight molecules + token vars for styling.
  Consumes taxonomy/kinds for palette generation.

  Blocks are dragged with Pragmatic DnD: from the palette into the tree's root
  or a slot, and between slots. A click adds a block too, and Cut + Paste in
  the Inspector moves one, so nothing here depends on the drag working.

  @since 1.0.0
-->
<script lang="ts">
import type { BlockNode } from "@devpulse/coldlight/blocks";
import { Button } from "@devpulse/coldlight/components/button";
import { SearchField } from "@devpulse/coldlight/components/search-field";
import { toast } from "svelte-sonner";
import { copyState, fill } from "#lib/sys/copy/index.js";
import { saveAutoSave } from "../../persistence/local-storage.js";
import { getKindSlots } from "../../registry/vpb-kinds.js";
import { blockDragId, dnd, paletteDragId, parseDragId } from "../../state/dnd.svelte.js";
import { vpb } from "../../state/vpb.svelte.js";
import { vpbDocument } from "../../state/vpb-document.svelte.js";
import { blockTemplates } from "./defaults.js";
import { DraggableFrame, DropZone } from "./dnd/index.js";
import { kindLabel, type PaletteItem, paletteGroups } from "./palette.js";
import { createBlock, validateBlockTree } from "./schema.js";

const ROOT_SLOT = "root";

const text = $derived(copyState.catalog?.vpb);
const tree = $derived(vpbDocument.document.root);
const problems = $derived(validateBlockTree(tree).errors ?? []);

// Local state for collapsed categories
let collapsedCategories = $state<Set<string>>(new Set());
let searchQuery = $state("");

function describeKind(kind: string): string {
	return text?.kinds?.[kind]?.description ?? "";
}

function labelOf(kind: string): string {
	return text?.kinds?.[kind]?.label ?? kindLabel(kind);
}

// Filtered palette items
const filteredGroups = $derived.by(() => {
	const q = searchQuery.trim().toLowerCase();
	if (!q) return paletteGroups;
	return paletteGroups
		.map((group) => ({
			...group,
			items: group.items.filter(
				(item) =>
					labelOf(item.kind).toLowerCase().includes(q) ||
					describeKind(item.kind).toLowerCase().includes(q),
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

/** Say why a slot refused a block. */
function warnRefused(kind: string, parentId: string | null, slot: string) {
	const parent = parentId ? (vpbDocument.selectedNode?.kind ?? "") : "";
	toast.warning(fill(text?.refused ?? "", { kind, slot, parent }));
}

/** Where a click adds a block: the selected slot, the selected block's first slot, or the root. */
function clickTarget(): { parentId: string | null; slot: string } {
	const selected = vpbDocument.selectedNode;
	const slot = vpbDocument.selectedSlot ?? (selected ? getKindSlots(selected.kind)[0] : undefined);
	return selected && slot ? { parentId: selected.id, slot } : { parentId: null, slot: ROOT_SLOT };
}

function addBlock(node: BlockNode, parentId: string | null, slot: string) {
	const added = parentId ? vpbDocument.addNode(node, parentId, slot) : vpbDocument.addNode(node);
	if (!added) warnRefused(node.kind, parentId, slot);
}

// Add block from palette
function addBlockFromPalette(item: PaletteItem) {
	const { parentId, slot } = clickTarget();
	addBlock(createBlock(item.kind, { recipe: item.defaultRecipe }), parentId, slot);
}

// Add block from a template
function addTemplate(create: () => BlockNode) {
	const { parentId, slot } = clickTarget();
	addBlock(create(), parentId, slot);
}

/** Whether a slot takes what is being dragged. */
function canDropInto(draggedId: string, parentId: string | null, slot: string): boolean {
	const source = parseDragId(draggedId);
	if (!source) return false;
	return source.type === "palette"
		? vpbDocument.canPlace(source.kind, parentId, slot)
		: vpbDocument.canMove(source.id, parentId, slot);
}

/** A drop: a palette kind becomes a new block, a tree block moves. */
function handleDrop(draggedId: string, parentId: string | null, slot: string) {
	const source = parseDragId(draggedId);
	if (!source) return;
	if (source.type === "palette") {
		addBlock(createBlock(source.kind), parentId, slot);
	} else {
		vpbDocument.moveNode(source.id, parentId, slot);
	}
}

// Recursive block tree renderer: every slot of the kind, and any the document holds
function getBlockChildren(block: BlockNode): Array<{ slot: string; children: BlockNode[] }> {
	const slots = new Set([...getKindSlots(block.kind), ...Object.keys(block.slots ?? {})]);
	const result: Array<{ slot: string; children: BlockNode[] }> = [];
	slots.forEach((slot) => {
		result.push({ slot, children: block.slots?.[slot] ?? [] });
	});
	return result;
}

/** A click selects a block; Ctrl+click adds it to the selection. */
function selectBlock(e: MouseEvent, id: string) {
	if (e.ctrlKey) {
		vpbDocument.toggleMultiSelect(id);
	} else {
		vpbDocument.selectNode(id);
	}
}
</script>

<div class="flex flex-col h-full overflow-hidden" data-slot="builder-tab">
	<!-- Header -->
	<div class="vpb-section__heading flex items-center gap-2">
		<span class="vpb-section__dot" data-tone="builder"></span>
		<h3 class="flex-1">{text?.builder_heading}</h3>
		<span class="vpb-section__meta">{fill(text?.block_count ?? "", { count: tree.length })}</span>
	</div>

	<!-- Search -->
	<div class="vpb-section">
		<SearchField
			size="sm"
			value={searchQuery}
			onValueChange={(value) => (searchQuery = value)}
			onClear={() => (searchQuery = "")}
			placeholder={text?.search_placeholder}
			aria-label={text?.search_placeholder}
		/>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto">
		<!-- Templates -->
		<div class="vpb-section">
			<div class="vpb-section__label">{text?.templates_heading}</div>
			<div class="grid grid-cols-2 gap-1 mt-1">
				{#each blockTemplates as template (template.id)}
					{@const copy = text?.templates?.[template.id]}
					<Button
						variant="ghost"
						size="sm"
						class="justify-start truncate"
						onclick={() => addTemplate(template.create)}
						title={copy?.description}
					>
						{copy?.label}
					</Button>
				{/each}
			</div>
		</div>

		<!-- Block Palette -->
		<div class="vpb-section">
			<div class="vpb-section__label">{text?.palette_heading}</div>
			{#each filteredGroups as group (group.id)}
				{@const category = text?.categories?.[group.id]}
				<div class="mb-2">
					<!-- Category Header -->
					<button
						class="vpb-section__toggle flex items-center gap-2 w-full"
						data-state={collapsedCategories.has(group.id) ? "collapsed" : "open"}
						title={category?.description}
						onclick={() => toggleCategory(group.id)}
					>
						<span class="vpb-section__chevron">▶</span>
						<span class="flex-1 text-left">{category?.label ?? group.id}</span>
						<span class="vpb-section__meta">{group.items.length}</span>
					</button>

					<!-- Category Items -->
					{#if !collapsedCategories.has(group.id)}
						<div class="grid grid-cols-2 gap-1 mt-1">
							{#each group.items as item (item.id)}
								<DraggableFrame id={paletteDragId(item.kind)}>
									<Button
										variant="ghost"
										size="sm"
										class="w-full justify-start gap-2"
										onclick={() => addBlockFromPalette(item)}
										title={describeKind(item.kind)}
									>
										<span class="vpb-section__meta">
											{#if item.layoutMode === "grid"}
												⊞
											{:else if item.layoutMode === "flex"}
												⊟
											{:else}
												◻
											{/if}
										</span>
										<span class="truncate">{labelOf(item.kind)}</span>
									</Button>
								</DraggableFrame>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Block Tree -->
		<div class="vpb-section">
			<div class="vpb-section__label flex items-center justify-between">
				<span>{text?.tree_heading}</span>
				{#if tree.length > 0}
					<Button variant="ghost" size="sm" onclick={() => vpbDocument.clearTree()}>
						{text?.clear}
					</Button>
				{/if}
			</div>
			{#if problems.length > 0}
				<p class="vpb-section__meta" data-state="warning" title={problems[0]?.message}>
					{fill(text?.tree_problems ?? "", { count: problems.length })}
				</p>
			{/if}
			<div class="space-y-1">
				{#each tree as block (block.id)}
					{@render blockTreeItem(block, 0)}
				{/each}
			</div>
			<DropZone
				id={ROOT_SLOT}
				canDrop={(draggedId) => canDropInto(draggedId, null, ROOT_SLOT)}
				onDrop={(draggedId) => handleDrop(draggedId, null, ROOT_SLOT)}
			>
				<p class="vpb-tree__slot text-center" data-state={dnd.isDragging ? "ready" : "idle"}>
					{text?.root_drop}
				</p>
			</DropZone>
		</div>
	</div>

	<!-- Footer Actions -->
	<div class="vpb-section__footer flex items-center gap-1">
		<Button
			variant="secondary"
			size="sm"
			class="flex-1"
			onclick={() => vpbDocument.undo()}
			disabled={!vpbDocument.canUndo}
		>
			{text?.undo}
		</Button>
		<Button
			variant="secondary"
			size="sm"
			class="flex-1"
			onclick={() => vpbDocument.redo()}
			disabled={!vpbDocument.canRedo}
		>
			{text?.redo}
		</Button>
		<Button
			variant="secondary"
			size="sm"
			class="flex-1"
			onclick={() => saveAutoSave(vpbDocument.document)}
		>
			{text?.save}
		</Button>
		<Button variant="primary" size="sm" class="flex-1" onclick={() => vpb.toggleWorkspace()}>
			{text?.open_workspace}
		</Button>
	</div>
</div>

{#snippet blockTreeItem(block: BlockNode, depth: number)}
	<div style:padding-left="calc({depth} * var(--space-3))">
		<DraggableFrame id={blockDragId(block.id)}>
			<Button
				variant="ghost"
				size="sm"
				class="w-full justify-start gap-2"
				data-selected={vpbDocument.multiSelect.includes(block.id)}
				onclick={(e: MouseEvent) => selectBlock(e, block.id)}
			>
				<span class="flex-1 truncate text-left">{labelOf(block.kind)}</span>
				<span class="vpb-section__meta truncate">{block.recipe.split("-").pop()}</span>
			</Button>
		</DraggableFrame>

		<!-- Render children -->
		{#each getBlockChildren(block) as { slot, children } (slot)}
			{#if children.length > 0 || dnd.isDragging || vpbDocument.selectedNodeId === block.id}
				<div style:padding-left="calc({depth + 1} * var(--space-3))">
					<DropZone
						id={`${block.id}/${slot}`}
						canDrop={(draggedId) => canDropInto(draggedId, block.id, slot)}
						onDrop={(draggedId) => handleDrop(draggedId, block.id, slot)}
					>
						<button
							class="vpb-tree__slot w-full text-left"
							data-selected={vpbDocument.selectedNodeId === block.id &&
								vpbDocument.selectedSlot === slot}
							onclick={() => vpbDocument.selectNode(block.id, slot)}
						>
							{slot}
						</button>
					</DropZone>
				</div>
			{/if}
			{#each children as child (child.id)}
				{@render blockTreeItem(child, depth + 2)}
			{/each}
		{/each}
	</div>
{/snippet}
