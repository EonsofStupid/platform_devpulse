import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

export interface UseMenuProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onSelect?: (value: string) => void;
	"aria-label"?: string;
	/** No trigger button (a context menu): the content names itself through aria-label alone. */
	triggerless?: boolean;
}

export type MenuTriggerAttrs = HTMLButtonAttributes & {
	"data-kind": "menu";
	"data-slot": "trigger";
	"data-state": "open" | "closed";
};

export type MenuContentAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "menu";
	"data-slot": "content";
	"data-state": "open" | "closed";
};

export type MenuSeparatorAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "menu";
	"data-slot": "separator";
};

export type MenuItemAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "menu";
	"data-slot": "item";
	"data-value": string;
	"data-disabled"?: "";
};

export type MenuGroupAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "menu";
	"data-slot": "group";
};

export interface UseMenuReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: MenuTriggerAttrs;
	readonly content: MenuContentAttrs;
	readonly separator: MenuSeparatorAttrs;
	getItem(value: string, options?: { disabled?: boolean; onSelect?: () => void }): MenuItemAttrs;
	getGroup(label: string): MenuGroupAttrs;
	attachContent: (node: HTMLElement) => { destroy(): void };
}
