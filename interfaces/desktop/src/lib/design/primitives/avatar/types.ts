/**
 * @file Avatar Primitive Types
 * @description Structural type declarations for the avatar primitive.
 * Aligned to taxonomy contract: kind="avatar"
 * Slots: root, image (self-closing), fallback
 * ariaStateProvider: "coldlight" — image element with fallback, direct ARIA application.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Avatar root — container for image + fallback */
export interface AvatarProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}

/** Avatar image — self-closing img element (no children) */
export interface AvatarImageProps extends OmitStyle<HTMLImageElement>, BaseProps {}

/** Avatar fallback — shown when image is unavailable */
export interface AvatarFallbackProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}
