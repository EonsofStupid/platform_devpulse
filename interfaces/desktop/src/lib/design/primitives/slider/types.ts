/**
 * @file Slider Primitive Types
 * @description Structural type declarations for the slider primitive.
 * Aligned to taxonomy contract: kind="slider"
 * Slots: root, track, range, thumb
 * ariaStateProvider: "meltui" — createSlider provides ARIA range widget + keyboard interaction.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Slider root — container for the slider track and thumb(s) */
export interface SliderProps extends OmitStyle<HTMLDivElement>, BaseProps {
	/** Current value(s) — array for multi-thumb support (bindable) */
	value?: number[];
	children?: Snippet;
}

/** Slider track — background track for the slider */
export interface SliderTrackProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Slider range — filled portion between min and thumb (or between thumbs) */
export interface SliderRangeProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Slider thumb — draggable handle for value adjustment */
export interface SliderThumbProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}
