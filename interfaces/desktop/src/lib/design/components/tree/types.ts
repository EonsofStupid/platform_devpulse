/**
 * @file Tree Types
 * @kind tree
 * @layer components
 */

import type { TreePrimitiveProps } from "$lib/design/primitives/tree/index.js";

export type TreePreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface TreeProps extends TreePrimitiveProps {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: TreePreset;
}
