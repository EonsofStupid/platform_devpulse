/**
 * @file Avatar Types
 * @kind avatar
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type AvatarSize = "sm" | "md" | "lg";
export type AvatarLoadState = "loading" | "loaded" | "error";

export interface AvatarProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	src?: string;
	alt: string;
	fallback?: string;
	size?: AvatarSize;
}
