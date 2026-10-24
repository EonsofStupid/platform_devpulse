import type { HTMLAttributes } from "svelte/elements";

export interface UseColorWheelProps {
	/** Current hue angle in degrees, 0..360. @default 0 */
	hue?: number;
	/** Fired on every drag + keyboard move with the new hue. */
	onHueChange?: (hue: number) => void;
	/** Fired when the user releases the thumb or stops a keyboard drag. */
	onHueCommit?: (hue: number) => void;
	/** Keyboard step in degrees. @default 1 */
	step?: number;
	/** Thickness of the track as a ratio of the radius, used to compute the thumb's radial position. @default 0.12 */
	thickness?: number;
	/** @default false */
	disabled?: boolean;
	/** Accessible label when no visible label is rendered. @default "Hue" */
	"aria-label"?: string;
}

export type ColorWheelRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "color-wheel";
	"data-slot": "root";
	"data-disabled"?: "";
};

export type ColorWheelTrackAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "color-wheel";
	"data-slot": "track";
	"data-disabled"?: "";
};

export type ColorWheelThumbAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "color-wheel";
	"data-slot": "thumb";
	"data-disabled"?: "";
	"data-dragging"?: "";
};

export interface UseColorWheelReturn {
	/** Current hue angle in degrees, 0..360. */
	readonly hue: number;
	/** Whether the user is currently dragging the thumb. */
	readonly isDragging: boolean;
	/** Spread onto the root container. */
	readonly root: ColorWheelRootAttrs;
	/** Spread onto the circular track (accepts pointer events). */
	readonly track: ColorWheelTrackAttrs;
	/** Spread onto the focusable thumb element. */
	readonly thumb: ColorWheelThumbAttrs;
	/** Programmatic setter — same effect as keyboard/pointer move. */
	setHue(hue: number): void;
}
