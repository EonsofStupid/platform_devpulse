/**
 * Button hook prop and return types.
 */

import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export type ButtonType = "button" | "submit" | "reset";

export interface UseButtonProps {
	/** Whether the button is disabled. */
	disabled?: boolean;
	/** Whether the button is in a loading state (treated as disabled). */
	loading?: boolean;
	/** Toggle mode: the pressed state. `undefined` = not a toggle button. */
	pressed?: boolean;
	/** Callback when pressed state changes (toggle mode only). */
	onPressedChange?: (pressed: boolean) => void;
	/** Menu trigger mode: whether the controlled region is expanded. */
	expanded?: boolean;
	/** HTML button type attribute. Default: "button". */
	type?: ButtonType;
}

export interface ButtonRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	type: ButtonType;
	role: "button";
	"aria-disabled": boolean | undefined;
	"aria-pressed": boolean | undefined;
	"aria-expanded": boolean | undefined;
	"aria-busy": boolean | undefined;
	"data-disabled": "" | undefined;
	"data-loading": "" | undefined;
	"data-state": "on" | "off" | undefined;
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface UseButtonReturn {
	/** Spread onto the root `<button>` element. */
	readonly root: ButtonRootAttrs;
	/** Current pressed state (toggle mode). */
	readonly pressed: boolean | undefined;
	/** Whether the button is functionally disabled (disabled OR loading). */
	readonly isDisabled: boolean;
	/** Programmatically press (toggle mode only). */
	press(): void;
	/** Programmatically unpress (toggle mode only). */
	unpress(): void;
	/** Programmatically toggle pressed state (toggle mode only). */
	toggle(): void;
}
