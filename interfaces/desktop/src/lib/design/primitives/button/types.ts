/**
 * @file Button Primitive Types
 * @kind button
 * @layer primitives
 * @description Structural type declarations for the button primitive.
 *
 * Aligned to taxonomy contract: kind="button"
 * Slots: root
 * ariaStateProvider: "coldlight"
 *
 * Zero ARIA. Zero behavior. Structural shell only.
 * ARIA and state management belong in the component layer.
 */

import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { BaseProps } from "../types.js";

/** Button root slot props — renders <button> element */
export interface ButtonRootProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
	children?: Snippet;
}
