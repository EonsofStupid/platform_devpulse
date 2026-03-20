import type { HTMLAttributes } from "svelte/elements";

export interface UseTooltipProps {
	openDelay?: number;
	closeDelay?: number;
}

export type TooltipTriggerAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "tooltip";
	"data-slot": "trigger";
};

export type TooltipContentAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "tooltip";
	"data-slot": "content";
	"data-state": "open" | "closed";
};

export interface UseTooltipReturn {
	readonly open: boolean;
	readonly trigger: TooltipTriggerAttrs;
	readonly content: TooltipContentAttrs;
}
