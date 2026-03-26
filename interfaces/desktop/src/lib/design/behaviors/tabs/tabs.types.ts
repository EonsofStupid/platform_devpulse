import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
import type { Orientation } from "../_internal/utils/kbd.js";

export interface UseTabsProps {
	value?: string;
	onValueChange?: (value: string) => void;
	orientation?: Orientation;
	activateOnFocus?: boolean;
	loop?: boolean;
}

export type TabsRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "tabs";
	"data-slot": "root";
	"data-orientation": Orientation;
};

export type TabsListAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "tabs";
	"data-slot": "list";
	"data-orientation": Orientation;
};

export type TabsTriggerAttrs = HTMLButtonAttributes & {
	"data-kind": "tabs";
	"data-slot": "trigger";
	"data-state": "active" | "inactive";
	"data-value": string;
	"data-disabled"?: "";
};

export type TabsContentAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "tabs";
	"data-slot": "content";
	"data-state": "visible" | "hidden";
};

export interface UseTabsReturn {
	readonly value: string;
	readonly root: TabsRootAttrs;
	readonly list: TabsListAttrs;
	getTrigger(tabValue: string, disabled?: boolean): TabsTriggerAttrs;
	getContent(tabValue: string): TabsContentAttrs;
}
