/**
 * @file src/lib/sys/debug/vpb/types/vpb.ts
 * @description VPB type definitions.
 * @since 1.0.0
 */

import type { BlockKind } from "$lib/design/taxonomy/kinds";
import type { BlockNode } from "../components/builder/schema";

// ===========================================
// VPB UI STATE
// ===========================================

/**
 * VPB tab selection.
 */
export type VPBTab = "inspector" | "builder";

/**
 * VPB panel position.
 */
export interface VPBPosition {
  x: number;
  y: number;
}

/**
 * VPB panel size.
 */
export interface VPBSize {
  width: number;
  height: number;
}

// ===========================================
// SELECTION STATE
// ===========================================

/**
 * Selection state for the block tree.
 */
export interface VPBSelection {
  /** Selected block ID (null if none) */
  blockId: string | null;
  /** Selected slot within the block */
  slotName: string | null;
  /** Multiple selection IDs */
  multiSelect: string[];
}

// ===========================================
// CLIPBOARD STATE
// ===========================================

/**
 * Clipboard for copy/paste operations.
 */
export interface VPBClipboard {
  /** Copied block (deep clone) */
  block: BlockNode | null;
  /** Cut mode (will delete on paste) */
  isCut: boolean;
}

// ===========================================
// HISTORY STATE
// ===========================================

/**
 * History entry for undo/redo.
 */
export interface VPBHistoryEntry {
  /** Timestamp */
  timestamp: number;
  /** Description of the action */
  action: string;
  /** Tree snapshot before the action */
  snapshot: BlockNode[];
}

// ===========================================
// DRAG STATE
// ===========================================

/**
 * Drag state for builder.
 */
export interface VPBDragState {
  /** Currently dragging */
  isDragging: boolean;
  /** Dragged item (palette kind or block ID) */
  dragSource: { type: "palette"; kind: BlockKind } | { type: "block"; id: string } | null;
  /** Current drop target */
  dropTarget: { blockId: string; slotName: string } | null;
  /** Drop is valid */
  isValidDrop: boolean;
}

// ===========================================
// COMBINED VPB STATE
// ===========================================

/**
 * Complete VPB state interface.
 */
export interface VPBState {
  // UI State
  isOpen: boolean;
  activeTab: VPBTab;
  position: VPBPosition;
  size: VPBSize;

  // Block Tree
  tree: BlockNode[];

  // Selection
  selection: VPBSelection;

  // Clipboard
  clipboard: VPBClipboard;

  // Drag & Drop
  drag: VPBDragState;

  // History
  history: VPBHistoryEntry[];
  historyIndex: number;
}

// ===========================================
// VPB ACTIONS
// ===========================================

/**
 * Actions that can be performed on the block tree.
 */
export type VPBAction =
  | { type: "ADD_BLOCK"; parentId: string | null; slotName: string; block: BlockNode }
  | { type: "REMOVE_BLOCK"; blockId: string }
  | { type: "MOVE_BLOCK"; blockId: string; targetParentId: string | null; targetSlot: string; targetIndex: number }
  | { type: "UPDATE_PROPS"; blockId: string; props: Partial<BlockNode["props"]> }
  | { type: "UPDATE_RECIPE"; blockId: string; recipe: string }
  | { type: "SELECT"; blockId: string | null; slotName?: string | null }
  | { type: "MULTI_SELECT"; blockIds: string[] }
  | { type: "COPY"; blockId: string }
  | { type: "CUT"; blockId: string }
  | { type: "PASTE"; parentId: string; slotName: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_TREE" }
  | { type: "LOAD_TREE"; tree: BlockNode[] };

// ===========================================
// INSPECTOR TYPES
// ===========================================

/**
 * Inspector field definition.
 */
export interface InspectorField {
  /** Field key (prop path) */
  key: string;
  /** Display label */
  label: string;
  /** Field type for rendering */
  type: "select" | "text" | "number" | "boolean" | "color" | "slider";
  /** Available options (for select) */
  options?: Array<{ value: string; label: string }>;
  /** Current value */
  value: unknown;
  /** Default value */
  defaultValue: unknown;
  /** Is required */
  required: boolean;
}

/**
 * Inspector section grouping fields.
 */
export interface InspectorSection {
  /** Section ID */
  id: string;
  /** Section label */
  label: string;
  /** Collapsed state */
  collapsed: boolean;
  /** Fields in this section */
  fields: InspectorField[];
}
