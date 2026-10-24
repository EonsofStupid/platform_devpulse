/**
 * @file Sheet Component Types
 * @kind sheet
 * @layer components
 */

import type { Snippet } from "svelte";
import type { SheetPrimitiveProps } from "#coldlight/behaviors/overlays/sheet/index.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { SheetVariant } from "./sheet.generated.js";

export type { SheetSide } from "#coldlight/behaviors/overlays/sheet/index.js";
export type { SheetVariant } from "./sheet.generated.js";

export type SheetSize = "sm" | "md" | "lg" | "xl" | "full";

export interface SheetComponentProps extends SheetPrimitiveProps {
	/** Trigger snippet rendered as a button that opens the sheet */
	trigger?: Snippet;
	/** Panel surface role, from sheet.tokens.json; the family in scope supplies it. Default: "elevated" */
	variant?: SheetVariant;
	/** Family for the panel and what it holds; unset, it takes the family in scope. */
	surface?: SurfaceFamily;
	/** Sheet width/height. Default: "md" */
	size?: SheetSize;
	/** Accessible label for the sheet */
	label?: string;
}
