/**
 * @file Toggle Group Component Types
 * @kind toggle-group
 * @layer components
 *
 * Extends primitive with builder state props, visual sizing.
 * Component layer owns ARIA via builder — primitive is structureless.
 *
 * Note: primitive uses onValueChange(string | string[]) but component
 * uses SvelteSet — so we Omit and re-declare.
 */

import type { Snippet } from "svelte";
import type { SvelteSet } from "svelte/reactivity";
import type { ToggleGroupPrimitiveProps } from "#coldlight/behaviors/inputs/toggle-group/index.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { ToggleGroupVariant } from "./toggle-group.generated.js";

export type ToggleGroupSize = "sm" | "md" | "lg";

export type { ToggleGroupOrientation } from "#coldlight/behaviors/inputs/toggle-group/index.js";
export type { ToggleGroupVariant } from "./toggle-group.generated.js";

/** Item definition for toggle group */
export interface ToggleGroupItem {
	value: string;
	label: string;
	disabled?: boolean;
}

/** ToggleGroup component props — builder state + composition + primitive */
export interface ToggleGroupComponentProps
	extends Omit<ToggleGroupPrimitiveProps, "onValueChange" | "value" | "children"> {
	children?: Snippet;
	/** Toggle items to render */
	items?: ToggleGroupItem[];
	/** Size variant */
	size?: ToggleGroupSize;
	/** Current value(s). */
	value?: string | Iterable<string>;
	/** Called when value changes (single mode). */
	onValueChange?: ((value: string | undefined) => void) | ((value: SvelteSet<string>) => void);
	/** Allow multiple items pressed simultaneously. @default false */
	multiple?: boolean;
	/** Whether arrow keys loop. @default true */
	loop?: boolean;
	/** Surface role, from toggle-group.tokens.json; the family in scope supplies it. Default: "elevated" */
	variant?: ToggleGroupVariant;
	/** Family for this group (a scope of one); unset, it takes the family in scope. */
	surface?: SurfaceFamily;
}
