import type { HTMLButtonAttributes } from "svelte/elements";

export interface UseToggleProps {
	/** Controlled value; `undefined` leaves the state to the toggle. */
	pressed?: boolean;
	/** Starting value when uncontrolled. */
	defaultPressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	disabled?: boolean;
	"aria-label"?: string;
}

export type ToggleRootAttrs = HTMLButtonAttributes & {
	"data-kind": "toggle";
	"data-slot": "root";
	"data-state": "on" | "off";
	"data-disabled"?: "";
};

export interface UseToggleReturn {
	readonly pressed: boolean;
	readonly root: ToggleRootAttrs;
	toggle(): void;
}
