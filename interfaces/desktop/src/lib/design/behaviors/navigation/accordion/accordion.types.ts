import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

export type AccordionType = "single" | "multiple";

export interface UseAccordionProps {
	/** Which items are expanded. String for single, string[] for multiple. */
	value?: string | string[];
	/** Callback when expanded items change. */
	onValueChange?: (value: string | string[]) => void;
	/** Single (one at a time) or multiple (any number). Default: "single". */
	type?: AccordionType;
	/** Whether all triggers are disabled. */
	disabled?: boolean;
	/** Allow collapsing the last open item (single mode). Default: false. */
	collapsible?: boolean;
}

export type AccordionRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "accordion";
	"data-slot": "root";
	"data-disabled"?: "";
};

export type AccordionItemAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "accordion";
	"data-slot": "item";
	"data-state": "open" | "closed";
	"data-value": string;
};

export type AccordionTriggerAttrs = HTMLButtonAttributes & {
	"data-kind": "accordion";
	"data-slot": "trigger";
	"data-state": "open" | "closed";
	"data-disabled"?: "";
};

export type AccordionContentAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "accordion";
	"data-slot": "content";
	"data-state": "open" | "closed";
};

export interface UseAccordionReturn {
	readonly value: string | string[];
	readonly root: AccordionRootAttrs;
	getItem(itemValue: string): AccordionItemAttrs;
	getTrigger(itemValue: string, disabled?: boolean): AccordionTriggerAttrs;
	getContent(itemValue: string): AccordionContentAttrs;
}
