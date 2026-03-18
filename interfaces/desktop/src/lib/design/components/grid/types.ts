/**
 * @file Grid Types
 * @kind grid
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type GridColumns =
	| "1"
	| "2"
	| "3"
	| "4"
	| "5"
	| "6"
	| "7"
	| "8"
	| "9"
	| "10"
	| "11"
	| "12"
	| "auto"
	| "none";
export type GridGap = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "none";
export type GridRows = "1" | "2" | "3" | "4" | "5" | "6" | "auto" | "none";

export interface GridProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	columns?: GridColumns;
	gap?: GridGap;
	rows?: GridRows;
}
