/**
 * @file src/lib/sys/debug/vpb/components/builder/state.ts
 * @layer lib
 * @description State Manager for the Builder Domain (Synthesis Mode).
 * Handles canvas operations, element selection for editing, and drag-and-drop.
 * @since 1.0.0
 */
import type { ElementInfo } from "../inspector/state";

class BuilderState {
    // --------------------------------------------------------
    // STATE (Runes)
    // --------------------------------------------------------

    /** Is the builder active? */
    isActive = $state(false);

    /** Currently selected element for editing */
    selectedNode = $state<ElementInfo | null>(null);

    /** Dragging state for builder components */
    isDraggingParams = $state(false);

    // --------------------------------------------------------
    // ACTIONS
    // --------------------------------------------------------

    setActive(active: boolean) {
        this.isActive = active;
    }

    selectNode(node: ElementInfo | null) {
        this.selectedNode = node;
    }
}

export const builder = new BuilderState();
