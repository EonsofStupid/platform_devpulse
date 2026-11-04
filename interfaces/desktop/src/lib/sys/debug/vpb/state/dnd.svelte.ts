/**
 * @fileoverview dnd.svelte.ts
 * @file src/lib/sys/debug/vpb/state/dnd.svelte.ts
 * @module @devpulse/sys/debug/vpb/state/dnd.svelte
 * @layer lib
 *
 * @description
 * Runes-powered state for the Builder's drag-and-drop operations, and the
 * ids a drag carries: a palette kind, or a block already in the tree.
 *
 * @dependencies
 * - ../types/dnd.ts, ../types/vpb.ts
 *
 * @consumers
 * - components/builder/dnd/DraggableFrame.svelte, DropZone.svelte
 * - components/builder/Builder.svelte
 *
 * @since 1.0.0
 */

import type { DropEffect as AnyDropEffect } from "../types/dnd.js";
import type { VPBDragState } from "../types/vpb.js";

/**
 * DnD State Management
 * Runes-powered state for drag-and-drop operations.
 */

/** The effect a drop can have (`none` is simply not dropping). */
export type DropEffect = Exclude<AnyDropEffect, "none">;

const PALETTE_PREFIX = "palette:";
const BLOCK_PREFIX = "block:";

/** The drag id of a palette kind. */
export function paletteDragId(kind: string): string {
	return `${PALETTE_PREFIX}${kind}`;
}

/** The drag id of a block in the tree. */
export function blockDragId(id: string): string {
	return `${BLOCK_PREFIX}${id}`;
}

/** What a drag id names. */
export function parseDragId(id: string): VPBDragState["dragSource"] {
	if (id.startsWith(PALETTE_PREFIX)) {
		return { type: "palette", kind: id.slice(PALETTE_PREFIX.length) };
	}
	if (id.startsWith(BLOCK_PREFIX)) {
		return { type: "block", id: id.slice(BLOCK_PREFIX.length) };
	}
	return null;
}

class DnDManager {
	/** Whether a drag operation is in progress */
	isDragging = $state(false);

	/** ID of the currently dragged element */
	activeId = $state<string | null>(null);

	/** Current drop effect */
	dropEffect = $state<DropEffect>("move");

	// ─────────────────────────────────────────────────────────────
	// Methods
	// ─────────────────────────────────────────────────────────────

	/** Set dragging state with element ID */
	setDragging(id: string | null): void {
		this.isDragging = id !== null;
		this.activeId = id;
	}

	/** Set the drop effect */
	setDropEffect(effect: DropEffect): void {
		this.dropEffect = effect;
	}

	/** Reset drag state */
	reset(): void {
		this.isDragging = false;
		this.activeId = null;
		this.dropEffect = "move";
	}
}

export const dnd = new DnDManager();
