export type SheetSide = "top" | "right" | "bottom" | "left";

export interface UseSheetProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Which edge the sheet slides from. Default: "right". */
	side?: SheetSide;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
}

export interface UseSheetReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: Record<string, unknown>;
	readonly overlay: Record<string, unknown>;
	readonly content: Record<string, unknown>;
	readonly title: Record<string, unknown>;
	readonly description: Record<string, unknown>;
	readonly close: Record<string, unknown>;
	attachContent: (node: HTMLDialogElement) => { destroy(): void };
	attachOverlay: (node: HTMLElement) => { destroy(): void };
	attachTrigger: (node: HTMLElement) => { destroy(): void };
}
