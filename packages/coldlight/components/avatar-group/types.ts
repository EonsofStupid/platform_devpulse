/**
 * @file AvatarGroup Component Types
 * @kind avatar-group
 * @layer components
 *
 * Layout container for overlapping avatars.
 * Passes size to Avatar children via context.
 * Overflow indicator when maxVisible exceeded.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";

export type AvatarGroupPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface AvatarGroupIds {
	root?: string;
}

export interface AvatarGroupRootProps
	extends UIBaseProps,
		Omit<HTMLAttributes<HTMLDivElement>, "children" | "class" | "dir"> {
	ids?: Partial<AvatarGroupIds>;
	/** Size in pixels passed to all child Avatars. Default: 24. */
	size?: number;
	/** Accessible label for the group. */
	label?: string;
	/** Maximum visible avatars before overflow. Remainder shows +N. */
	maxVisible?: number;
	/** Total count — used with maxVisible for +N calculation when not all children rendered. */
	total?: number;
	/** Style preset. Default: "default". */
	preset?: AvatarGroupPreset;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** Avatar children. */
	children?: Snippet;
	/** Custom overflow indicator snippet. Receives overflow count. */
	overflow?: Snippet<[number]>;
}
