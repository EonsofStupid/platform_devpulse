import type { ColdLightDataAttrs } from "../../_internal/types/common.js";
import type { Orientation } from "../../_internal/utils/kbd.js";

export interface UseTabsProps {
	/** The currently active tab value. */
	value?: string;
	/** Callback when active tab changes. */
	onValueChange?: (value: string) => void;
	/** Tab list orientation. Default: "horizontal". */
	orientation?: Orientation;
	/** Activate tab on focus (true) or require Enter/Space (false). Default: true. */
	activateOnFocus?: boolean;
	/** Loop from last tab to first. Default: true. */
	loop?: boolean;
}

export interface TabsRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	"data-orientation": Orientation;
}

export interface TabsListAttrs extends ColdLightDataAttrs {
	"data-slot": "list";
	role: "tablist";
	"aria-orientation": Orientation;
	"data-orientation": Orientation;
}

export interface TabsTriggerAttrs extends ColdLightDataAttrs {
	"data-slot": "trigger";
	role: "tab";
	type: "button";
	id: string;
	"aria-selected": boolean;
	"aria-controls": string;
	tabindex: 0 | -1;
	"data-state": "active" | "inactive";
	"data-value": string;
	"data-disabled": "" | undefined;
	"aria-disabled": boolean | undefined;
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface TabsContentAttrs extends ColdLightDataAttrs {
	"data-slot": "content";
	role: "tabpanel";
	id: string;
	"aria-labelledby": string;
	tabindex: 0;
	hidden: boolean | undefined;
	"data-state": "visible" | "hidden";
}

export interface UseTabsReturn {
	readonly value: string;
	readonly root: TabsRootAttrs;
	readonly list: TabsListAttrs;
	/** Get trigger attrs for a specific tab. */
	getTrigger(tabValue: string, disabled?: boolean): TabsTriggerAttrs;
	/** Get content attrs for a specific tab. */
	getContent(tabValue: string): TabsContentAttrs;
}
