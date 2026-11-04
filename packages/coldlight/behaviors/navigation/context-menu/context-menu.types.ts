import type { HTMLAttributes } from "svelte/elements";
import type { UseMenuReturn } from "../menu/menu.types.js";

export interface UseContextMenuProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onSelect?: (value: string) => void;
	"aria-label"?: string;
}

export type ContextMenuTriggerAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "context-menu";
	"data-slot": "trigger";
	"data-state": "open" | "closed";
};

export interface UseContextMenuReturn {
	/** The menu behavior: open state, items, separator, group. */
	readonly menu: UseMenuReturn;
	/** Where the menu opens, in viewport coordinates. */
	readonly position: { readonly x: number; readonly y: number };
	/** The right-click zone. */
	readonly trigger: ContextMenuTriggerAttrs;
	/** Open at a viewport position. */
	openAt(x: number, y: number): void;
	/** Attach to the content: the menu's own layers, kept inside the viewport. */
	attachContent: (node: HTMLElement) => { destroy(): void };
}
