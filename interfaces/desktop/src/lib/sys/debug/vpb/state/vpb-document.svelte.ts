/**
 * @file VPB Document State — Svelte 5 Rune Class
 * @layer vpb
 * @package @devpulse/sys
 *
 * Core state management for the VPB session.
 * Manages the active document, selection, and undo/redo.
 * Uses Svelte 5 class-based rune pattern.
 */

import { createBlockDocument } from "$lib/design/blocks/factory.js";
import {
	type BlockDocument,
	BlockDocumentSchema,
	type BlockNode,
} from "$lib/design/blocks/schema.js";

class VpbDocumentState {
	document = $state<BlockDocument>(createBlockDocument());
	selectedNodeId = $state<string | null>(null);
	expandedNodeIds = $state<Set<string>>(new Set());
	dirty = $state<boolean>(false);

	#undoStack: string[] = [];
	#redoStack: string[] = [];
	#maxHistory = 50;

	get selectedNode(): BlockNode | null {
		if (!this.selectedNodeId) return null;
		return this.#findNode(this.document.root, this.selectedNodeId);
	}

	get canUndo(): boolean {
		return this.#undoStack.length > 0;
	}

	get canRedo(): boolean {
		return this.#redoStack.length > 0;
	}

	load(doc: unknown): void {
		const parsed = BlockDocumentSchema.parse(doc) as BlockDocument;
		this.document = parsed;
		this.selectedNodeId = null;
		this.expandedNodeIds = new Set();
		this.#undoStack = [];
		this.#redoStack = [];
		this.dirty = false;
	}

	newDocument(label = "Untitled"): void {
		this.document = createBlockDocument(label);
		this.selectedNodeId = null;
		this.expandedNodeIds = new Set();
		this.#undoStack = [];
		this.#redoStack = [];
		this.dirty = false;
	}

	selectNode(id: string | null): void {
		this.selectedNodeId = id;
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

	addNode(node: BlockNode, parentId?: string, slotName?: string): void {
		this.#snapshot();
		if (parentId && slotName) {
			const parent = this.#findNode(this.document.root, parentId);
			if (parent) {
				if (!parent.slots) parent.slots = {};
				if (!parent.slots[slotName]) parent.slots[slotName] = [];
				parent.slots[slotName].push(node);
			}
		} else {
			this.document.root.push(node);
		}
		this.document.updatedAt = new Date().toISOString();
		this.dirty = true;
		this.selectedNodeId = node.id;
	}

	removeNode(id: string): void {
		this.#snapshot();
		this.#removeFromTree(this.document.root, id);
		this.document.updatedAt = new Date().toISOString();
		this.dirty = true;
		if (this.selectedNodeId === id) {
			this.selectedNodeId = null;
		}
	}

	updateNodeProps(id: string, props: Partial<BlockNode["props"]>): void {
		this.#snapshot();
		const node = this.#findNode(this.document.root, id);
		if (node) {
			node.props = { ...node.props, ...props };
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
	}

	redo(): void {
		if (this.#redoStack.length === 0) return;
		this.#undoStack.push(JSON.stringify(this.document));
		// biome-ignore lint/style/noNonNullAssertion: length check above guarantees non-empty stack
		const next = this.#redoStack.pop()!;
		this.document = JSON.parse(next);
		this.dirty = true;
	}

	#snapshot(): void {
		this.#undoStack.push(JSON.stringify(this.document));
		if (this.#undoStack.length > this.#maxHistory) {
			this.#undoStack.shift();
		}
		this.#redoStack = [];
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
