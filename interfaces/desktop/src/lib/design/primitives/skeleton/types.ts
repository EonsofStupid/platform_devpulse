/**
 * @file Skeleton Primitive Types
 * @description Structural type declarations for the skeleton primitive.
 * Aligned to taxonomy contract: kind="skeleton"
 * Slots: root
 * ariaStateProvider: "coldlight" — presentational placeholder, no complex state machine.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Skeleton root — loading placeholder shell */
export interface SkeletonProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
