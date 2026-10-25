/**
 * @fileoverview dnd.svelte.ts
 * @file src/lib/sys/debug/vpb/state/dnd.svelte.ts
 * @module @devpulse/sys/debug/vpb/state/dnd.svelte
 * @layer lib
 *
 * @description
 * [TODO: Describe the purpose and responsibility of this module]
 *
 * @dependencies
 * - [TODO: List imports this file depends on]
 *
 * @consumers
 * - [TODO: List modules that import this file]
 *
 * @vpb-editable [TODO: List props VPB can modify, or 'none']
 * @since 1.0.0
 */

/**
 * DnD State Management
 * Runes-powered state for drag-and-drop operations.
 */

export type DropEffect = 'move' | 'copy';

class DnDManager {
  /** Whether a drag operation is in progress */
  isDragging = $state(false);
  
  /** ID of the currently dragged element */
  activeId = $state<string | null>(null);
  
  /** Current drop effect */
  dropEffect = $state<DropEffect>('move');
  
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
    this.dropEffect = 'move';
  }
}

export const dnd = new DnDManager();
