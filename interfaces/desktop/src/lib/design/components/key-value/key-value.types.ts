/**
 * @file KeyValue Types
 * @kind key-value
 * @render html
 * @category content
 */

import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

export type KeyValueSize = "sm" | "md" | "lg";

export interface KeyValueProps
	extends UIBaseProps,
		Omit<HTMLAttributes<HTMLDivElement>, "children" | "class"> {
	/** The label (key) */
	label: string;
	/** The value — string or number */
	value: string | number;
	/** Size variant */
	size?: KeyValueSize;
}
