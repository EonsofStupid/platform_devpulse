/**
 * @file EmptyState Component Types
 * @kind empty-state
 * @layer components
 *
 * ARIA + state only. ZERO visual.
 * Visual props (size, ColdLightProps) belong in ui/empty-state/.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

/** EmptyState component props — ARIA + state only. ZERO visual. */
export interface EmptyStateComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
