import type { HTMLAttributes, HTMLLabelAttributes } from "svelte/elements";
import type { ColorChannel } from "../color-slider/color-slider.types.js";

export interface UseColorAreaProps {
	/** Channel controlled by the x-axis. @default "saturation" */
	xChannel?: ColorChannel;
	/** Channel controlled by the y-axis. @default "lightness" */
	yChannel?: ColorChannel;
	/** Current x-axis value, 0..1. @default 0.5 */
	xValue?: number;
	/** Current y-axis value, 0..1. @default 0.5 */
	yValue?: number;
	/** Fired on every drag + keyboard move with the new normalised coordinates. */
	onValueChange?: (x: number, y: number) => void;
	/** Fired when the user releases the thumb or stops a keyboard drag. */
	onValueCommit?: (x: number, y: number) => void;
	/** Keyboard step, fraction of 1. @default 0.01 */
	step?: number;
	/** RTL layouts flip the x-axis. @default false */
	rtl?: boolean;
	/** @default false */
	disabled?: boolean;
	/** Accessible label when no visible label is rendered. */
	"aria-label"?: string;
}

export type ColorAreaRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "color-area";
	"data-slot": "root";
	"data-disabled"?: "";
};

export type ColorAreaGradientAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "color-area";
	"data-slot": "gradient";
	"data-disabled"?: "";
};

export type ColorAreaThumbAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "color-area";
	"data-slot": "thumb";
	"data-disabled"?: "";
	"data-dragging"?: "";
};

export type ColorAreaLabelAttrs = HTMLLabelAttributes & {
	"data-kind": "color-area";
	"data-slot": "label";
	"data-disabled"?: "";
};

export interface UseColorAreaReturn {
	/** Current normalised x, 0..1. */
	readonly xValue: number;
	/** Current normalised y, 0..1. */
	readonly yValue: number;
	/** Whether the user is currently dragging the thumb. */
	readonly isDragging: boolean;
	/** Spread onto the root container. */
	readonly root: ColorAreaRootAttrs;
	/** Spread onto the gradient surface (accepts pointer events). */
	readonly gradient: ColorAreaGradientAttrs;
	/** Spread onto the focusable thumb element. */
	readonly thumb: ColorAreaThumbAttrs;
	/** Spread onto an optional label element. */
	readonly label: ColorAreaLabelAttrs;
	/** Programmatic setter — same effect as keyboard/pointer move. */
	setValue(x: number, y: number): void;
}
