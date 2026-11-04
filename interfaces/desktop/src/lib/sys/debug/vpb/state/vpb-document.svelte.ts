/**
 * @file VPB Document State — Svelte 5 Rune Class
 * @layer vpb
 * @package @devpulse/sys
 *
 * Core state management for the VPB session.
 * Manages the active document, selection, clipboard and undo/redo.
 * Uses Svelte 5 class-based rune pattern.
 *
 * Moving a block, the clipboard, multi-select and slot rules come from the
 * earlier block store (`state/vpb.svelte.ts`, deleted in 19135a32), whose UI
 * half is back in that file.
 */

import {
	type BlockDocument,
	BlockDocumentSchema,
	type BlockNode,
	createBlockDocument,
} from "@devpulse/coldlight/blocks";
import { generateBlockId } from "../components/builder/schema.js";
import type { VpbProps } from "../registry/vpb-axes.js";
import { isChildAllowed } from "../registry/vpb-kinds.js";
import type { VPBClipboard } from "../types/vpb.js";

/**
 * Deep clone a block node.
 */
function cloneBlock(block: BlockNode): BlockNode {
	return JSON.parse(JSON.stringify(block));
}

/**
 * A pasted block needs new IDs, for itself and all children.
 */
function regenerateIds(block: BlockNode): BlockNode {
	const fresh: BlockNode = { ...block, id: generateBlockId() };
	if (block.slots) {
		fresh.slots = Object.fromEntries(
			Object.entries(block.slots).map(([slot, children]) => [slot, children.map(regenerateIds)]),
		);
	}
	return fresh;
}

class VpbDocumentState {
	document = $state<BlockDocument>(createBlockDocument());
	selectedNodeId = $state<string | null>(null);
	/** Selected slot within the selected block; new blocks go there. */
	selectedSlot = $state<string | null>(null);
	/** Every selected block, for actions on several at once. */
	multiSelect = $state<string[]>([]);
	/** Copied or cut block (deep clone) */
	clipboard = $state<VPBClipboard>({ block: null, isCut: false });
	expandedNodeIds = $state<Set<string>>(new Set());
	dirty = $state<boolean>(false);

	#undoStack: string[] = [];
	#redoStack: string[] = [];
	#maxHistory = 50;
	/** Bumped on every stack change, so `canUndo` / `canRedo` are reactive. */
	#historyVersion = $state(0);

	get selectedNode(): BlockNode | null {
		if (!this.selectedNodeId) return null;
		return this.#findNode(this.document.root, this.selectedNodeId);
	}

	get canUndo(): boolean {
		return this.#historyVersion >= 0 && this.#undoStack.length > 0;
	}

	get canRedo(): boolean {
		return this.#historyVersion >= 0 && this.#redoStack.length > 0;
	}

	/** Load a document; throws with ArkType's summary when it does not validate. */
	load(doc: unknown): void {
		this.document = BlockDocumentSchema.assert(doc) as BlockDocument;
		this.clearSelection();
		this.expandedNodeIds = new Set();
		this.#undoStack = [];
		this.#redoStack = [];
		this.#historyVersion++;
		this.dirty = false;
	}

	newDocument(label = "Untitled"): void {
		this.document = createBlockDocument(label);
		this.clearSelection();
		this.expandedNodeIds = new Set();
		this.#undoStack = [];
		this.#redoStack = [];
		this.#historyVersion++;
		this.dirty = false;
	}

	selectNode(id: string | null, slotName: string | null = null): void {
		this.selectedNodeId = id;
		this.selectedSlot = slotName;
		this.multiSelect = id ? [id] : [];
	}

	clearSelection(): void {
		this.selectNode(null);
	}

	toggleMultiSelect(id: string): void {
		this.multiSelect = this.multiSelect.includes(id)
			? this.multiSelect.filter((selected) => selected !== id)
			: [...this.multiSelect, id];
	}

	toggleExpanded(id: string): void {
		const next = new Set(this.expandedNodeIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		this.expandedNodeIds = next;
	}

	/** Whether a kind may go into a parent's slot (the root takes any kind). */
	canPlace(kind: string, parentId: string | null, slotName: string): boolean {
		if (!parentId) return true;
		const parent = this.#findNode(this.document.root, parentId);
		return parent !== null && isChildAllowed(parent.kind, slotName, kind);
	}

	/** Whether a block may move there: allowed by the slot, and not into itself. */
	canMove(id: string, targetParentId: string | null, targetSlot: string): boolean {
		const node = this.#findNode(this.document.root, id);
		if (!node) return false;
		if (targetParentId && this.#findNode([node], targetParentId)) return false;
		return this.canPlace(node.kind, targetParentId, targetSlot);
	}

	/** Add a block to the root or a parent's slot; false when the slot refuses its kind. */
	addNode(node: BlockNode, parentId?: string, slotName?: string): boolean {
		const parent = parentId && slotName ? parentId : null;
		const slot = slotName ?? "root";
		if (!this.canPlace(node.kind, parent, slot)) return false;
		this.#snapshot();
		this.#targetList(parent, slot)?.push(node);
		this.#touch();
		this.selectNode(node.id);
		return true;
	}

	removeNode(id: string): void {
		this.removeNodes([id]);
	}

	/** Remove several blocks as one undo step. */
	removeNodes(ids: readonly string[]): void {
		this.#snapshot();
		for (const id of ids) {
			this.#removeFromTree(this.document.root, id);
		}
		this.#touch();
		if (this.selectedNodeId && ids.includes(this.selectedNodeId)) {
			this.clearSelection();
		} else {
			this.multiSelect = this.multiSelect.filter((id) => !ids.includes(id));
		}
	}

	/** Move a block to a new parent/slot; false when that is not allowed. */
	moveNode(
		id: string,
		targetParentId: string | null,
		targetSlot: string,
		targetIndex = -1,
	): boolean {
		const node = this.#findNode(this.document.root, id);
		if (!node || !this.canMove(id, targetParentId, targetSlot)) return false;
		const moving = cloneBlock(node);
		this.#snapshot();
		this.#removeFromTree(this.document.root, id);
		const target = this.#targetList(targetParentId, targetSlot);
		if (target) {
			const index = targetIndex >= 0 ? Math.min(targetIndex, target.length) : target.length;
			target.splice(index, 0, moving);
		}
		this.#touch();
		return true;
	}

	copy(id: string): void {
		const node = this.#findNode(this.document.root, id);
		if (node) this.clipboard = { block: cloneBlock(node), isCut: false };
	}

	cut(id: string): void {
		const node = this.#findNode(this.document.root, id);
		if (node) this.clipboard = { block: cloneBlock(node), isCut: true };
	}

	/** Paste the clipboard with new ids; false when the slot refuses it or it holds nothing. */
	paste(parentId: string | null, slotName: string): boolean {
		const { block, isCut } = this.clipboard;
		if (!block || !this.canPlace(block.kind, parentId, slotName)) return false;
		// A cut block cannot land inside itself: its slots are about to go.
		if (isCut && parentId && this.#findNode([block], parentId)) return false;
		const pasted = regenerateIds(block);
		this.#snapshot();
		// If cut, remove original
		if (isCut) {
			this.#removeFromTree(this.document.root, block.id);
			this.clipboard = { block: null, isCut: false };
		}
		this.#targetList(parentId, slotName)?.push(pasted);
		this.#touch();
		this.selectNode(pasted.id);
		return true;
	}

	clearTree(): void {
		this.#snapshot();
		this.document.root = [];
		this.#touch();
		this.clearSelection();
	}

	/**
	 * Replace a node's visual props. The option ids come from the token
	 * manifest at runtime, so they are strings here; the schema validates
	 * them as strings on load and save.
	 */
	updateNodeProps(id: string, props: VpbProps): void {
		this.#snapshot();
		const node = this.#findNode(this.document.root, id);
		if (node) {
			node.props = { ...props } as BlockNode["props"];
			this.document.updatedAt = new Date().toISOString();
			this.dirty = true;
		}
	}

	updateNodeRecipe(id: string, recipeId: string): void {
		this.#snapshot();
		const node = this.#findNode(this.document.root, id);
		if (node) {
			node.recipe = recipeId;
			this.document.updatedAt = new Date().toISOString();
			this.dirty = true;
		}
	}

	updateNodeMeta(id: string, meta: Partial<BlockNode["meta"]>): void {
		const node = this.#findNode(this.document.root, id);
		if (node) {
			node.meta = { ...node.meta, ...meta };
		}
	}

	undo(): void {
		if (this.#undoStack.length === 0) return;
		this.#redoStack.push(JSON.stringify(this.document));
		// biome-ignore lint/style/noNonNullAssertion: length check above guarantees non-empty stack
		const prev = this.#undoStack.pop()!;
		this.document = JSON.parse(prev);
		this.dirty = true;
		this.#historyVersion++;
	}

	redo(): void {
		if (this.#redoStack.length === 0) return;
		this.#undoStack.push(JSON.stringify(this.document));
		// biome-ignore lint/style/noNonNullAssertion: length check above guarantees non-empty stack
		const next = this.#redoStack.pop()!;
		this.document = JSON.parse(next);
		this.dirty = true;
		this.#historyVersion++;
	}

	#snapshot(): void {
		this.#undoStack.push(JSON.stringify(this.document));
		if (this.#undoStack.length > this.#maxHistory) {
			this.#undoStack.shift();
		}
		this.#redoStack = [];
		this.#historyVersion++;
	}

	/** The list a node goes into: the root, or a parent's slot (created when missing). */
	#targetList(parentId: string | null, slotName: string): BlockNode[] | null {
		if (!parentId) return this.document.root;
		const parent = this.#findNode(this.document.root, parentId);
		if (!parent) return null;
		if (!parent.slots) parent.slots = {};
		if (!parent.slots[slotName]) parent.slots[slotName] = [];
		return parent.slots[slotName];
	}

	#touch(): void {
		this.document.updatedAt = new Date().toISOString();
		this.dirty = true;
	}

	#findNode(nodes: BlockNode[], id: string): BlockNode | null {
		for (const node of nodes) {
			if (node.id === id) return node;
			if (node.slots) {
				for (const children of Object.values(node.slots)) {
					const found = this.#findNode(children, id);
					if (found) return found;
				}
			}
		}
		return null;
	}

	#removeFromTree(nodes: BlockNode[], id: string): boolean {
		for (let i = 0; i < nodes.length; i++) {
			if (nodes[i].id === id) {
				nodes.splice(i, 1);
				return true;
			}
			const node = nodes[i];
			if (node.slots) {
				for (const children of Object.values(node.slots)) {
					if (this.#removeFromTree(children, id)) return true;
				}
			}
		}
		return false;
	}
}

export const vpbDocument = new VpbDocumentState();
