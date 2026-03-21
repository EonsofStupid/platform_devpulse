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
import type { PreparedComponentProps } from "$lib/design/components/_base/types.js";

export interface AvatarGroupIds {
	root?: string;
}

export interface AvatarGroupRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		Omit<PreparedComponentProps, "size"> {
	ids?: Partial<AvatarGroupIds>;
	/** Size in pixels passed to all child Avatars. Default: 24. */
	size?: number;
	/** Accessible label for the group. */
	label?: string;
	/** Maximum visible avatars before overflow. Remainder shows +N. */
	maxVisible?: number;
	/** Total count — used with maxVisible for +N calculation when not all children rendered. */
	total?: number;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** Avatar children. */
	children?: Snippet;
	/** Custom overflow indicator snippet. Receives overflow count. */
	overflow?: Snippet<[number]>;
}
