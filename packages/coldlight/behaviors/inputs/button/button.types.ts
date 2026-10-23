import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";

export type ButtonType = "button" | "submit" | "reset";

export interface UseButtonProps {
	disabled?: boolean;
	loading?: boolean;
	/** Controlled pressed state; makes it a toggle button. */
	pressed?: boolean;
	/** Starting pressed state of a toggle button that holds its own state. */
	defaultPressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	expanded?: boolean;
	type?: ButtonType;
}

export type ButtonRootAttrs = HTMLButtonAttributes & {
	"data-kind": "button";
	"data-slot": "root";
	"data-state"?: "on" | "off";
	"data-disabled"?: "";
	"data-loading"?: "";
};

export interface UseButtonReturn {
	readonly root: ButtonRootAttrs;
	readonly pressed: boolean | undefined;
	readonly isDisabled: boolean;
	press(): void;
	unpress(): void;
	toggle(): void;
}

// PrimitiveProps — used by Component layer to extend
export interface ButtonPrimitiveProps extends Omit<HTMLButtonAttributes, "children"> {
	children?: Snippet;
	class?: string;
	type?: ButtonType;
	disabled?: boolean;
	loading?: boolean;
	/** Pressed state, when the owner controls it; makes it a toggle button */
	pressed?: boolean;
	/** Starting pressed state of a toggle button that holds its own state */
	defaultPressed?: boolean;
	/** Called with every change the user asks for (controlled or not) */
	onPressedChange?: (pressed: boolean) => void;
	expanded?: boolean;
}
