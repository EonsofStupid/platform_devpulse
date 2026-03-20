import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseMenuProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Called when a menu item is selected. */
	onSelect?: (value: string) => void;
	"aria-label"?: string;
}

export interface MenuTriggerAttrs extends ColdLightDataAttrs {
	"data-slot": "trigger";
	type: "button";
	"aria-expanded": boolean;
	"aria-haspopup": "menu";
	"aria-controls": string;
	"data-state": "open" | "closed";
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface MenuContentAttrs extends ColdLightDataAttrs {
	"data-slot": "content";
	id: string;
	role: "menu";
	"aria-label": string | undefined;
	"data-state": "open" | "closed";
	onkeydown: (e: KeyboardEvent) => void;
}

export interface MenuSeparatorAttrs extends ColdLightDataAttrs {
	"data-slot": "separator";
	role: "separator";
}

export interface MenuItemAttrs extends ColdLightDataAttrs {
	"data-slot": "item";
	role: "menuitem";
	tabindex: -1;
	"data-value": string;
	"data-disabled": "" | undefined;
	"aria-disabled": boolean | undefined;
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface MenuGroupAttrs extends ColdLightDataAttrs {
	"data-slot": "group";
	role: "group";
	"aria-label": string;
}

export interface UseMenuReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: MenuTriggerAttrs;
	readonly content: MenuContentAttrs;
	readonly separator: MenuSeparatorAttrs;
	getItem(value: string, options?: { disabled?: boolean }): MenuItemAttrs;
	getGroup(label: string): MenuGroupAttrs;
	attachContent: (node: HTMLElement) => { destroy(): void };
}
