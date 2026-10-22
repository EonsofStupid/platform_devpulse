/**
 * @file Popover Component Types
 * @kind popover
 * @layer components
 */

import type { Snippet } from "svelte";
import type { PopoverPrimitiveProps } from "#coldlight/behaviors/overlays/popover/index.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { PopoverVariant } from "./popover.generated.js";

export type { PopoverVariant } from "./popover.generated.js";

export interface PopoverProps extends PopoverPrimitiveProps {
	/** Panel surface role, from popover.tokens.json; the family in scope supplies it. Default: "elevated" */
	variant?: PopoverVariant;
	/** Family for the panel and what it holds; unset, it takes the family in scope. */
	surface?: SurfaceFamily;
	/** Trigger snippet rendered as a button */
	trigger?: Snippet;
	/** Content snippet rendered in the floating panel */
	content?: Snippet;
}
