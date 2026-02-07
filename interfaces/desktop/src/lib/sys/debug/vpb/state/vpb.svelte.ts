/**
 * @file src/lib/sys/debug/vpb/state/vpb.svelte.ts
 * @description VPB state management with Svelte 5 runes.
 *
 * Manages the block tree, selection, clipboard, and history.
 * All block operations go through this store.
 *
 * @since 1.0.0
 */

import { getRecipe } from "$lib/design/recipes";
import type { BlockKind } from "$lib/design/taxonomy/vpb";
import { isChildAllowed } from "$lib/design/taxonomy/vpb";
import { type BlockNode, createBlock, generateBlockId } from "../components/builder/schema";
import type {
	VPBClipboard,
	VPBDragState,
	VPBHistoryEntry,
	VPBSelection,
	VPBTab,
} from "../types/vpb";

// ===========================================
// CONSTANTS
// ===========================================

const MAX_HISTORY = 50;

// ===========================================
// TREE UTILITIES
// ===========================================

/**
 * Deep clone a block node.
 */
function cloneBlock(block: BlockNode): BlockNode {
	return JSON.parse(JSON.stringify(block));
}

/**
 * Find a block by ID in the tree.
 */
function findBlockById(
	tree: BlockNode[],
	id: string,
): { block: BlockNode; parent: BlockNode | null; slot: string; index: number } | null {
	for (let i = 0; i < tree.length; i++) {
		if (tree[i].id === id) {
			return { block: tree[i], parent: null, slot: "root", index: i };
		}

		// Search in slots
		const block = tree[i];
		if (block.slots) {
			for (const [slotName, children] of Object.entries(block.slots)) {
				if (!children) continue;
				for (let j = 0; j < children.length; j++) {
					if (children[j].id === id) {
						return { block: children[j], parent: block, slot: slotName, index: j };
					}
					// Recurse
					const found = findBlockById([children[j]], id);
					if (found) return found;
				}
			}
		}
	}
	return null;
}

/**
 * Remove a block from the tree by ID.
 */
function removeBlockFromTree(tree: BlockNode[], id: string): BlockNode[] {
	return tree
		.filter((block) => block.id !== id)
		.map((block) => {
			if (block.slots) {
				const newSlots: Record<string, BlockNode[]> = {};
				for (const [slotName, children] of Object.entries(block.slots)) {
					if (children) {
						newSlots[slotName] = removeBlockFromTree(children, id);
					}
				}
				return { ...block, slots: newSlots };
			}
			return block;
		});
}

/**
 * Update a block in the tree by ID.
 */
function updateBlockInTree(
	tree: BlockNode[],
	id: string,
	updater: (block: BlockNode) => BlockNode,
): BlockNode[] {
	return tree.map((block) => {
		if (block.id === id) {
			return updater(block);
		}
		if (block.slots) {
			const newSlots: Record<string, BlockNode[]> = {};
			for (const [slotName, children] of Object.entries(block.slots)) {
				if (children) {
					newSlots[slotName] = updateBlockInTree(children, id, updater);
				}
			}
			return { ...block, slots: newSlots };
		}
		return block;
	});
}

// ===========================================
// VPB STORE CLASS
// ===========================================

class VPBStore {
	// ---- UI State ----
	isOpen = $state(false);
	activeTab = $state<VPBTab>("inspector");
	position = $state({ x: 0, y: 0 });
	size = $state({ width: 380, height: 500 });

	// ---- Block Tree ----
	tree = $state<BlockNode[]>([]);

	// ---- Selection ----
	selection = $state<VPBSelection>({
		blockId: null,
		slotName: null,
		multiSelect: [],
	});

	// ---- Clipboard ----
	clipboard = $state<VPBClipboard>({
		block: null,
		isCut: false,
	});

	// ---- Drag & Drop ----
	drag = $state<VPBDragState>({
		isDragging: false,
		dragSource: null,
		dropTarget: null,
		isValidDrop: false,
	});

	// ---- History ----
	history = $state<VPBHistoryEntry[]>([]);
	historyIndex = $state(-1);

	// ===========================================
	// DERIVED STATE
	// ===========================================

	/**
	 * Currently selected block (if any).
	 */
	get selectedBlock(): BlockNode | null {
		if (!this.selection.blockId) return null;
		const found = findBlockById(this.tree, this.selection.blockId);
		return found?.block ?? null;
	}

	/**
	 * Can undo.
	 */
	get canUndo(): boolean {
		return this.historyIndex > 0;
	}

	/**
	 * Can redo.
	 */
	get canRedo(): boolean {
		return this.historyIndex < this.history.length - 1;
	}

	/**
	 * Get recipe classes for selected block.
	 */
	get selectedRecipeClasses(): Record<string, string> | null {
		const block = this.selectedBlock;
		if (!block) return null;
		const recipe = getRecipe(block.recipe);
		if (!recipe) return null;
		const defaults = recipe.defaults as import("$lib/design/recipes/types.js").DsSurfaceProps;
		return recipe.classes(defaults);
	}

	// ===========================================
	// UI ACTIONS
	// ===========================================

	toggle() {
		this.isOpen = !this.isOpen;
	}

	open() {
		this.isOpen = true;
	}

	close() {
		this.isOpen = false;
	}

	setTab(tab: VPBTab) {
		this.activeTab = tab;
	}

	// ===========================================
	// HISTORY ACTIONS
	// ===========================================

	private pushHistory(action: string) {
		// Truncate any redo history
		if (this.historyIndex < this.history.length - 1) {
			this.history = this.history.slice(0, this.historyIndex + 1);
		}

		// Add new entry
		this.history.push({
			timestamp: Date.now(),
			action,
			snapshot: this.tree.map(cloneBlock),
		});

		// Trim old history
		if (this.history.length > MAX_HISTORY) {
			this.history = this.history.slice(-MAX_HISTORY);
		}

		this.historyIndex = this.history.length - 1;
	}

	undo() {
		if (!this.canUndo) return;
		this.historyIndex--;
		this.tree = this.history[this.historyIndex].snapshot.map(cloneBlock);
		this.clearSelection();
	}

	redo() {
		if (!this.canRedo) return;
		this.historyIndex++;
		this.tree = this.history[this.historyIndex].snapshot.map(cloneBlock);
		this.clearSelection();
	}

	// ===========================================
	// SELECTION ACTIONS
	// ===========================================

	select(blockId: string | null, slotName: string | null = null) {
		this.selection = {
			blockId,
			slotName,
			multiSelect: blockId ? [blockId] : [],
		};
	}

	clearSelection() {
		this.selection = {
			blockId: null,
			slotName: null,
			multiSelect: [],
		};
	}

	toggleMultiSelect(blockId: string) {
		const idx = this.selection.multiSelect.indexOf(blockId);
		if (idx >= 0) {
			this.selection.multiSelect = this.selection.multiSelect.filter((id) => id !== blockId);
		} else {
			this.selection.multiSelect = [...this.selection.multiSelect, blockId];
		}
	}

	// ===========================================
	// BLOCK TREE ACTIONS
	// ===========================================

	/**
	 * Add a new block to the tree.
	 */
	addBlock(kind: BlockKind, parentId: string | null, slotName: string, recipe?: string) {
		const block = createBlock(kind, { recipe });

		// Validate child is allowed
		if (parentId) {
			const parent = findBlockById(this.tree, parentId);
			if (parent && !isChildAllowed(parent.block.kind, slotName, kind)) {
				console.warn(
					`Child kind "${kind}" not allowed in slot "${slotName}" of "${parent.block.kind}"`,
				);
				return null;
			}
		}

		this.pushHistory(`Add ${kind}`);

		if (!parentId) {
			// Add to root
			this.tree = [...this.tree, block];
		} else {
			// Add to parent's slot
			this.tree = updateBlockInTree(this.tree, parentId, (parent) => {
				const slots = parent.slots ?? {};
				const slotChildren = slots[slotName] ?? [];
				return {
					...parent,
					slots: {
						...slots,
						[slotName]: [...slotChildren, block],
					},
				};
			});
		}

		// Select the new block
		this.select(block.id);
		return block;
	}

	/**
	 * Remove a block from the tree.
	 */
	removeBlock(blockId: string) {
		const found = findBlockById(this.tree, blockId);
		if (!found) return;

		this.pushHistory(`Remove ${found.block.kind}`);
		this.tree = removeBlockFromTree(this.tree, blockId);

		// Clear selection if removed
		if (this.selection.blockId === blockId) {
			this.clearSelection();
		}
	}

	/**
	 * Update block props.
	 */
	updateProps(blockId: string, props: Record<string, unknown>) {
		const found = findBlockById(this.tree, blockId);
		if (!found) return;

		this.pushHistory(`Update ${found.block.kind} props`);
		this.tree = updateBlockInTree(this.tree, blockId, (block) => ({
			...block,
			props: { ...(block.props as Record<string, unknown>), ...props },
		}));
	}

	/**
	 * Update block recipe.
	 */
	updateRecipe(blockId: string, recipe: string) {
		const found = findBlockById(this.tree, blockId);
		if (!found) return;

		this.pushHistory(`Update ${found.block.kind} recipe`);
		this.tree = updateBlockInTree(this.tree, blockId, (block) => ({
			...block,
			recipe,
		}));
	}

	/**
	 * Move a block to a new parent/slot.
	 */
	moveBlock(
		blockId: string,
		targetParentId: string | null,
		targetSlot: string,
		targetIndex: number = -1,
	) {
		const found = findBlockById(this.tree, blockId);
		if (!found) return;

		// Validate move
		if (targetParentId) {
			const targetParent = findBlockById(this.tree, targetParentId);
			if (targetParent && !isChildAllowed(targetParent.block.kind, targetSlot, found.block.kind)) {
				console.warn(`Cannot move: "${found.block.kind}" not allowed in slot "${targetSlot}"`);
				return;
			}
		}

		this.pushHistory(`Move ${found.block.kind}`);

		// Clone the block to move
		const blockToMove = cloneBlock(found.block);

		// Remove from current location
		this.tree = removeBlockFromTree(this.tree, blockId);

		// Add to new location
		if (!targetParentId) {
			// Move to root
			if (targetIndex >= 0 && targetIndex < this.tree.length) {
				this.tree = [
					...this.tree.slice(0, targetIndex),
					blockToMove,
					...this.tree.slice(targetIndex),
				];
			} else {
				this.tree = [...this.tree, blockToMove];
			}
		} else {
			// Move to parent's slot
			this.tree = updateBlockInTree(this.tree, targetParentId, (parent) => {
				const slots = parent.slots ?? {};
				const slotChildren = slots[targetSlot] ?? [];
				const insertIndex =
					targetIndex >= 0 ? Math.min(targetIndex, slotChildren.length) : slotChildren.length;
				return {
					...parent,
					slots: {
						...slots,
						[targetSlot]: [
							...slotChildren.slice(0, insertIndex),
							blockToMove,
							...slotChildren.slice(insertIndex),
						],
					},
				};
			});
		}
	}

	// ===========================================
	// CLIPBOARD ACTIONS
	// ===========================================

	copy(blockId: string) {
		const found = findBlockById(this.tree, blockId);
		if (!found) return;

		this.clipboard = {
			block: cloneBlock(found.block),
			isCut: false,
		};
	}

	cut(blockId: string) {
		const found = findBlockById(this.tree, blockId);
		if (!found) return;

		this.clipboard = {
			block: cloneBlock(found.block),
			isCut: true,
		};
	}

	paste(parentId: string | null, slotName: string) {
		if (!this.clipboard.block) return;

		// Regenerate IDs for the pasted block and all children
		const regenerateIds = (block: BlockNode): BlockNode => {
			const newBlock = {
				...block,
				id: generateBlockId(block.kind),
			};
			if (newBlock.slots) {
				const newSlots: Record<string, BlockNode[]> = {};
				for (const [slot, children] of Object.entries(newBlock.slots)) {
					if (children) {
						newSlots[slot] = children.map(regenerateIds);
					}
				}
				newBlock.slots = newSlots;
			}
			return newBlock;
		};

		const blockToPaste = regenerateIds(this.clipboard.block);

		// Validate
		if (parentId) {
			const parent = findBlockById(this.tree, parentId);
			if (parent && !isChildAllowed(parent.block.kind, slotName, blockToPaste.kind)) {
				console.warn(`Cannot paste: "${blockToPaste.kind}" not allowed in slot "${slotName}"`);
				return;
			}
		}

		this.pushHistory(`Paste ${blockToPaste.kind}`);

		// If cut, remove original
		if (this.clipboard.isCut && this.clipboard.block) {
			this.tree = removeBlockFromTree(this.tree, this.clipboard.block.id);
			this.clipboard = { block: null, isCut: false };
		}

		// Add pasted block
		if (!parentId) {
			this.tree = [...this.tree, blockToPaste];
		} else {
			this.tree = updateBlockInTree(this.tree, parentId, (parent) => {
				const slots = parent.slots ?? {};
				const slotChildren = slots[slotName] ?? [];
				return {
					...parent,
					slots: {
						...slots,
						[slotName]: [...slotChildren, blockToPaste],
					},
				};
			});
		}

		this.select(blockToPaste.id);
	}

	// ===========================================
	// DRAG & DROP ACTIONS
	// ===========================================

	startDragFromPalette(kind: BlockKind) {
		this.drag = {
			isDragging: true,
			dragSource: { type: "palette", kind },
			dropTarget: null,
			isValidDrop: false,
		};
	}

	startDragFromTree(blockId: string) {
		this.drag = {
			isDragging: true,
			dragSource: { type: "block", id: blockId },
			dropTarget: null,
			isValidDrop: false,
		};
	}

	updateDropTarget(blockId: string | null, slotName: string | null) {
		if (!blockId || !slotName) {
			this.drag.dropTarget = null;
			this.drag.isValidDrop = false;
			return;
		}

		this.drag.dropTarget = { blockId, slotName };

		// Validate drop
		if (this.drag.dragSource) {
			const targetBlock = findBlockById(this.tree, blockId);
			if (targetBlock) {
				const childKind =
					this.drag.dragSource.type === "palette"
						? this.drag.dragSource.kind
						: findBlockById(this.tree, this.drag.dragSource.id)?.block.kind;

				if (childKind) {
					this.drag.isValidDrop = isChildAllowed(targetBlock.block.kind, slotName, childKind);
				}
			}
		}
	}

	endDrag() {
		// If valid drop, perform the action
		if (
			this.drag.isDragging &&
			this.drag.isValidDrop &&
			this.drag.dropTarget &&
			this.drag.dragSource
		) {
			const { blockId, slotName } = this.drag.dropTarget;

			if (this.drag.dragSource.type === "palette") {
				this.addBlock(this.drag.dragSource.kind, blockId, slotName);
			} else {
				this.moveBlock(this.drag.dragSource.id, blockId, slotName);
			}
		}

		// Reset drag state
		this.drag = {
			isDragging: false,
			dragSource: null,
			dropTarget: null,
			isValidDrop: false,
		};
	}

	cancelDrag() {
		this.drag = {
			isDragging: false,
			dragSource: null,
			dropTarget: null,
			isValidDrop: false,
		};
	}

	// ===========================================
	// TREE MANAGEMENT
	// ===========================================

	clearTree() {
		this.pushHistory("Clear tree");
		this.tree = [];
		this.clearSelection();
	}

	loadTree(tree: BlockNode[]) {
		this.pushHistory("Load tree");
		this.tree = tree.map(cloneBlock);
		this.clearSelection();
		this.historyIndex = -1;
		this.history = [];
	}

	/**
	 * Export tree as JSON.
	 */
	exportTree(): string {
		return JSON.stringify(this.tree, null, 2);
	}

	/**
	 * Import tree from JSON.
	 */
	importTree(json: string) {
		try {
			const tree = JSON.parse(json);
			if (Array.isArray(tree)) {
				this.loadTree(tree);
			}
		} catch (e) {
			console.error("Failed to import tree:", e);
		}
	}
}

// ===========================================
// SINGLETON EXPORT
// ===========================================

export const vpb = new VPBStore();
