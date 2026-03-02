/**
 * @file Search Input Component Types
 * @kind search-input
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type SearchInputSize = "sm" | "md" | "lg";

/** SearchInput component props — builder state + recipe + primitive */
export interface SearchInputComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Size variant */
	size?: SearchInputSize;
	/** Search value. @default "" */
	value?: string;
	/** Called when value changes. */
	onValueChange?: (value: string) => void;
	/** Called when the search is cleared. */
	onClear?: () => void;
	/** Disable the search input. @default false */
	disabled?: boolean;
	/** Placeholder text. @default "Search..." */
	placeholder?: string;
	/** Accessible label for the search landmark. */
	"aria-label"?: string;
	/** ID of the describing element. */
	"aria-describedby"?: string;
}
