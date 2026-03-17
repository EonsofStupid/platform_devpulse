import type { Orientation } from "../../_internal/utils/kbd.js";

export interface UseSeparatorProps {
	/** Orientation of the separator. Default: "horizontal". */
	orientation?: Orientation;
	/** If true, separator is purely decorative (no role). Default: false. */
	decorative?: boolean;
}

export interface UseSeparatorReturn {
	readonly root: Record<string, unknown>;
}
