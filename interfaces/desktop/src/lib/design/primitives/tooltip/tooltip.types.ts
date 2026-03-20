import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseTooltipProps {
	/** Delay before showing (ms). Default: 700. */
	openDelay?: number;
	/** Delay before hiding (ms). Default: 300. */
	closeDelay?: number;
}

export interface TooltipTriggerAttrs extends ColdLightDataAttrs {
	"data-slot": "trigger";
	"aria-describedby": string | undefined;
	onpointerenter: (e: PointerEvent) => void;
	onpointerleave: (e: PointerEvent) => void;
	onfocus: (e: FocusEvent) => void;
	onblur: (e: FocusEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface TooltipContentAttrs extends ColdLightDataAttrs {
	"data-slot": "content";
	id: string;
	role: "tooltip";
	"data-state": "open" | "closed";
}

export interface UseTooltipReturn {
	readonly open: boolean;
	readonly trigger: TooltipTriggerAttrs;
	readonly content: TooltipContentAttrs;
}
