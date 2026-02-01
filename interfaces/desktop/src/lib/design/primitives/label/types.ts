/**
 * @file Label Primitive Types
 * @description Structural type declarations for the label primitive.
 * Aligned to taxonomy contract: kind="label"
 * Slots: root
 * ariaStateProvider: "coldlight" — native <label> handles semantics.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Label root — structural shell for form label */
export interface LabelProps extends OmitStyle<HTMLLabelElement>, BaseProps {
	children?: Snippet;
}
