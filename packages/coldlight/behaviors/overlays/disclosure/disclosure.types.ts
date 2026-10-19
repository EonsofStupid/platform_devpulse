import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

export type DisclosureState = "open" | "closed";

export interface UseDisclosureProps {
	/** Whether the panel is initially open. Defaults to false. */
	defaultOpen?: boolean;
	/** Controlled open state. */
	open?: boolean;
	/** Whether the disclosure can be toggled. Defaults to false. */
	disabled?: boolean;
	/** Accessible label for the trigger when it has no visible text. */
	"aria-label"?: string;
	/** Called when the open state changes. */
	onOpenChange?: (open: boolean) => void;
}

export type DisclosureRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "disclosure";
	"data-slot": "root";
	"data-state": DisclosureState;
};

export type DisclosureTriggerAttrs = HTMLButtonAttributes & {
	"data-kind": "disclosure";
	"data-slot": "trigger";
	"data-state": DisclosureState;
	"aria-expanded": boolean;
	"aria-controls": string;
};

export type DisclosurePanelAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "disclosure";
	"data-slot": "panel";
	"data-state": DisclosureState;
	"aria-labelledby": string;
	role: "region";
};

export interface UseDisclosureReturn {
	readonly isOpen: boolean;
	readonly state: DisclosureState;
	readonly root: DisclosureRootAttrs;
	readonly trigger: DisclosureTriggerAttrs;
	readonly panel: DisclosurePanelAttrs;
	open(): void;
	close(): void;
	toggle(): void;
}
