import type { HTMLAttributes } from "svelte/elements";
import type { Orientation } from "../../_internal/utils/kbd.js";

export interface UseSeparatorProps {
	orientation?: Orientation;
	decorative?: boolean;
}

export type SeparatorRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "separator";
	"data-slot": "root";
	"data-orientation": Orientation;
};

export interface UseSeparatorReturn {
	readonly root: SeparatorRootAttrs;
}
