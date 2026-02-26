/**
 * @file Container Component Types
 * @kind container
 * @layer components
 *
 * Max-width responsive container with size variants.
 * Component layer owns layout — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

/** Container component props — max-width responsive wrapper */
export interface ContainerComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Max-width size variant */
	size?: ContainerSize;
}
