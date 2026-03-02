/**
 * @file Stat Component Types
 * @kind stat
 * @layer components
 *
 * Extends primitive with size variant and accessible label.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type StatSize = "sm" | "md" | "lg";

/** Stat component props — ColdLight 8-axis + ARIA + recipe */
export interface StatComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Size variant — controls text sizing and spacing */
	size?: StatSize;
}
