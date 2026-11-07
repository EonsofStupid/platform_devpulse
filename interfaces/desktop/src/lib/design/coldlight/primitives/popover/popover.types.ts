export interface UsePopoverProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	modal?: boolean;
}

export interface UsePopoverReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: Record<string, unknown>;
	readonly content: Record<string, unknown>;
	readonly arrow: Record<string, unknown>;
	readonly close: Record<string, unknown>;
	attachContent: (node: HTMLElement) => { destroy(): void };
}
