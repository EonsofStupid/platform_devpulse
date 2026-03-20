import type { ColdLightDataAttrs } from "../../_internal/types/common.js";
import type { Orientation } from "../../_internal/utils/kbd.js";

export interface UseSeparatorProps {
	/** Orientation of the separator. Default: "horizontal". */
	orientation?: Orientation;
	/** If true, separator is purely decorative (no role). Default: false. */
	decorative?: boolean;
}

export interface SeparatorRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	role: "separator" | "none";
	"aria-orientation": Orientation | undefined;
	"aria-hidden": "true" | undefined;
	"data-orientation": Orientation;
}

export interface UseSeparatorReturn {
	readonly root: SeparatorRootAttrs;
}
