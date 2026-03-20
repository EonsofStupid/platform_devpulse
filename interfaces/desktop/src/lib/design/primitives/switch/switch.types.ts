import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseSwitchProps {
	/** Whether the switch is on. Default: false. */
	checked?: boolean;
	/** Callback when checked state changes. */
	onCheckedChange?: (checked: boolean) => void;
	/** Whether the switch is disabled. */
	disabled?: boolean;
	/** Whether the switch is required. */
	required?: boolean;
	/** Accessible label. */
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
}

export interface SwitchRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "switch";
	type: "button";
	tabindex: 0;
	"aria-checked": boolean;
	"aria-disabled": string;
	"aria-required": boolean | undefined;
	"aria-label": string | undefined;
	"aria-labelledby": string | undefined;
	"aria-describedby": string | undefined;
	"data-state": "checked" | "unchecked";
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface SwitchThumbAttrs extends ColdLightDataAttrs {
	"data-slot": "thumb";
	"aria-hidden": "true";
	"data-state": "checked" | "unchecked";
}

export interface SwitchLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
}

export interface UseSwitchReturn {
	readonly checked: boolean;
	readonly root: SwitchRootAttrs;
	readonly thumb: SwitchThumbAttrs;
	readonly label: SwitchLabelAttrs;
	toggle(): void;
	turnOn(): void;
	turnOff(): void;
}
