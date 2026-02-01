/**
 * @file Textarea Primitive Types
 * @description Structural type declarations for the textarea primitive.
 * Aligned to taxonomy contract: kind="textarea"
 * Slots: root
 * ariaStateProvider: "coldlight" — native <textarea> handles semantics.
 */

import type { OmitStyle, BaseProps } from "../types.js";

/** Textarea root — structural shell for multiline text input (no Snippet children) */
export interface TextareaProps extends OmitStyle<HTMLTextAreaElement>, BaseProps {}
