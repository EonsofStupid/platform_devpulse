/**
 * @file Center Component Types
 * @kind center
 * @layer components
 *
 * Centering container with inline variant.
 * Component layer owns layout — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** Center component props — centering container + ColdLight 8-axis */
export interface CenterComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Use inline-flex instead of flex for inline centering */
	inline?: boolean;
}
