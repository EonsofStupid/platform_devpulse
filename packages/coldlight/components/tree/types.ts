/**
 * @file Tree Types
 * @kind tree
 * @layer components
 */

import type { Snippet } from "svelte";
import type { TreePrimitiveProps } from "#coldlight/behaviors/navigation/tree/index.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { TreeVariant } from "./tree.generated.js";

export type { TreeVariant } from "./tree.generated.js";

export interface TreeProps extends TreePrimitiveProps {
	/** Generated surface role for each item. */
	variant?: TreeVariant;
	/** Inherited visual family; unset to use the surrounding family. */
	surface?: SurfaceFamily;
}

export interface TreeItemProps {
	/** Stable key, unique within this tree. */
	value: string;
	/** Accessible name and visible label. */
	label: string;
	disabled?: boolean;
	/** Child TreeItems; their group is shown while this item is expanded. */
	children?: Snippet;
	/** Optional decorative icon. */
	icon?: Snippet;
	/** Layout classes for the item. */
	class?: string;
}
