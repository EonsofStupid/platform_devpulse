/**
 * @file Input Primitive Types
 * @description Structural type declarations for the input primitive.
 * Aligned to taxonomy contract: kind="input"
 * Slots: root
 * ariaStateProvider: "coldlight" — native <input> handles semantics.
 */

import type { BaseProps, OmitStyle } from "../types.js";

/** Input root — structural shell for text input (self-closing, no children) */
export interface InputProps extends OmitStyle<HTMLInputElement>, BaseProps {}
