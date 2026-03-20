import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseToggleProps {
	/** Whether the toggle is pressed. Default: false. */
	pressed?: boolean;
	/** Callback when pressed state changes. */
	onPressedChange?: (pressed: boolean) => void;
	/** Whether the toggle is disabled. */
	disabled?: boolean;
	"aria-label"?: string;
}

export interface ToggleRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	type: "button";
	role: "button";
	"aria-pressed": boolean;
	"aria-disabled": boolean | undefined;
	"aria-label": string | undefined;
	"data-state": "on" | "off";
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface UseToggleReturn {
	readonly pressed: boolean;
	readonly root: ToggleRootAttrs;
	toggle(): void;
}
