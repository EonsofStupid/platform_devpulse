import type { Orientation } from "../../_internal/utils/kbd.js";

export interface UseToolbarProps {
	/** Accessible label for the toolbar. */
	label?: string;
	/** Orientation. Default: "horizontal". */
	orientation?: Orientation;
	/** Whether all items are disabled. */
	disabled?: boolean;
	/** Loop from last to first. Default: true. */
	loop?: boolean;
}

export interface UseToolbarReturn {
	readonly root: Record<string, unknown>;
	/** Get item attrs. Items use roving tabindex. */
	getItem(value: string, options?: { disabled?: boolean; active?: boolean }): Record<string, unknown>;
}
