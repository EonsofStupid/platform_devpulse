import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

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

export interface AccordionRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	"data-disabled": "" | undefined;
}

export interface AccordionItemAttrs extends ColdLightDataAttrs {
	"data-slot": "item";
	"data-state": "open" | "closed";
	"data-value": string;
}

export interface AccordionTriggerAttrs extends ColdLightDataAttrs {
	"data-slot": "trigger";
	type: "button";
	id: string;
	"aria-expanded": boolean;
	"aria-controls": string;
	"aria-disabled": boolean | undefined;
	"data-state": "open" | "closed";
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface AccordionContentAttrs extends ColdLightDataAttrs {
	"data-slot": "content";
	role: "region";
	id: string;
	"aria-labelledby": string;
	hidden: boolean | undefined;
	"data-state": "open" | "closed";
}

export interface UseAccordionReturn {
	readonly value: string | string[];
	readonly root: AccordionRootAttrs;
	/** Get item wrapper attrs. */
	getItem(itemValue: string): AccordionItemAttrs;
	/** Get trigger attrs for a specific item. */
	getTrigger(itemValue: string, disabled?: boolean): AccordionTriggerAttrs;
	/** Get content attrs for a specific item. */
	getContent(itemValue: string): AccordionContentAttrs;
}
