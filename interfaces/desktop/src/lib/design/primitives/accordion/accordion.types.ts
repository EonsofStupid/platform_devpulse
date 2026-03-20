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

export interface UseAccordionReturn {
	readonly value: string | string[];
	readonly root: Record<string, unknown>;
	/** Get item wrapper attrs. */
	getItem(itemValue: string): Record<string, unknown>;
	/** Get trigger attrs for a specific item. */
	getTrigger(itemValue: string, disabled?: boolean): Record<string, unknown>;
	/** Get content attrs for a specific item. */
	getContent(itemValue: string): Record<string, unknown>;
}
