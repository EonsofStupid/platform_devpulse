/**
 * @file sys/debug/vpb/types/dnd.ts
 * @description VPB drag and drop types
 */

/** VPB operating mode */
export type VPBMode = "inspect" | "build" | "preview";

/** Drag and drop effect */
export type DropEffect = "none" | "copy" | "move" | "link";

/** Element information for inspection */
export interface ElementInfo {
  tagName: string;
  id?: string;
  className?: string;
  rect: DOMRect;
}
