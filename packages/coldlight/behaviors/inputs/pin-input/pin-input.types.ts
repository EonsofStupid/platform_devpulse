import type { HTMLAttributes, HTMLInputAttributes, HTMLLabelAttributes } from "svelte/elements";

/**
 * What characters each cell accepts.
 * - `numeric`: 0-9 only, `inputmode="numeric"`, `pattern="[0-9]*"`
 * - `alphanumeric`: A-Z, a-z, 0-9, `inputmode="text"`
 * - `alphabetic`: A-Z, a-z, `inputmode="text"`
 */
export type PinInputType = "numeric" | "alphanumeric" | "alphabetic";

export interface UsePinInputProps {
	/** Number of cells in the group. @default 4 */
	length?: number;
	/** Controlled value — length-truncated / padded. */
	value?: string;
	/** Fired every time any cell changes the collected value. */
	onValueChange?: (value: string) => void;
	/** Fired when the last cell receives a value and the group is fully filled. */
	onComplete?: (value: string) => void;
	/** Character constraint. @default "numeric" */
	type?: PinInputType;
	/** Mask every filled cell (shows a placeholder character instead of the actual value). @default false */
	mask?: boolean;
	/** Placeholder character shown in empty cells. @default "○" */
	placeholder?: string;
	/** @default false */
	disabled?: boolean;
	/** Force OTP autofill hint on mobile Safari / iOS keyboards. @default true for numeric */
	otp?: boolean;
	/** Accessible label for the group. */
	"aria-label"?: string;
	/** ID of an external label element, forwarded to `aria-labelledby`. */
	"aria-labelledby"?: string;
}

export type PinInputRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "pin-input";
	"data-slot": "root";
	"data-disabled"?: "";
	"data-complete"?: "";
};

export type PinInputCellAttrs = HTMLInputAttributes & {
	"data-kind": "pin-input";
	"data-slot": "cell";
	"data-index": number;
	"data-disabled"?: "";
	"data-filled"?: "";
};

export type PinInputLabelAttrs = HTMLLabelAttributes & {
	"data-kind": "pin-input";
	"data-slot": "label";
	"data-disabled"?: "";
};

export interface UsePinInputReturn {
	/** Current collected value, length = `length`. Empty cells contribute an empty slot. */
	readonly value: string;
	/** Whether every cell is filled. */
	readonly isComplete: boolean;
	/** Spread onto the root container. */
	readonly root: PinInputRootAttrs;
	/** Spread onto an optional label. */
	readonly label: PinInputLabelAttrs;
	/**
	 * Per-cell attribute factory. Call with the cell index and spread
	 * the returned object onto the `<input>` element for that cell.
	 * Must be called inside a `$derived` if you want reactive values.
	 */
	cell(index: number): PinInputCellAttrs;
	/** Programmatic setter — replaces the whole value. */
	setValue(value: string): void;
	/** Programmatic clear. */
	clear(): void;
	/** Focus a specific cell (0-indexed). */
	focus(index: number): void;
}
