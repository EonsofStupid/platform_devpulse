/**
 * @file Spacer Component Types
 * @kind spacer
 * @layer components
 *
 * Flex spacer element. No children — purely presentational.
 * Component layer owns ARIA (aria-hidden="true").
 */

import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type SpacerSize = "auto" | "xs" | "sm" | "md" | "lg" | "xl";

/** Spacer component props — flex spacer */
export interface SpacerComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	/** Size variant — auto grows to fill, named sizes set fixed width/height */
	size?: SpacerSize;
}
