import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

export interface UseSwitchProps {
	/** Controlled value; `undefined` leaves the state to the switch. */
	checked?: boolean;
	/** Starting value when uncontrolled. */
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	disabled?: boolean;
	required?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
}

export type SwitchRootAttrs = HTMLButtonAttributes & {
	"data-kind": "switch";
	"data-slot": "root";
	"data-state": "checked" | "unchecked";
	"data-disabled"?: "";
};

export type SwitchThumbAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "switch";
	"data-slot": "thumb";
	"data-state": "checked" | "unchecked";
};

export type SwitchLabelAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "switch";
	"data-slot": "label";
	"data-disabled"?: "";
};

export interface UseSwitchReturn {
	readonly checked: boolean;
	readonly root: SwitchRootAttrs;
	readonly thumb: SwitchThumbAttrs;
	readonly label: SwitchLabelAttrs;
	toggle(): void;
	turnOn(): void;
	turnOff(): void;
}
