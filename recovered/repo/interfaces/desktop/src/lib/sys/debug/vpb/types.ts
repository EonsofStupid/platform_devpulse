/**
 * @file src/lib/sys/debug/vpb/types.ts
 * @layer lib
 * @description Single Source of Truth for all VPB types and interfaces.
 * @since 1.0.0
 */

/**
 * The high-level mode of the Visual Page Builder.
 * - 'docked': Minimized to bottom-right or panel.
 * - 'floating': Detached window.
 * - 'minimized': Icon only.
 */
export type VPBMode = 'docked' | 'floating' | 'minimized';

/**
 * The active functional domain.
 * - 'inspector': Analysis mode (scanning, viewing).
 * - 'builder': Synthesis mode (drag-and-drop, editing).
 */
export type VPBDomain = 'inspector' | 'builder';

/**
 * Standardized position coordinates.
 */
export interface XYPosition {
    x: number;
    y: number;
}

/**
 * Metadata extracted from a DOM element during valid inspection.
 */
export interface InspectionData {
    tagName: string;
    id: string | null;
    classList: string[];
    /** Source file path (e.g., 'src/routes/+page.svelte') */
    sourceFile: string | null;
    /** Line number range in source file */
    sourceLine: { start: number; end: number } | null;
    /** Computed styles relevant to layout */
    computedStyles: Record<string, string>;
    /** Inner text content (truncated) */
    textSnippet?: string;
}

/**
 * Drag and Drop operation state.
 */
export interface DragState {
    isDragging: boolean;
    activeId: string | null;
    type: 'move' | 'copy';
}
