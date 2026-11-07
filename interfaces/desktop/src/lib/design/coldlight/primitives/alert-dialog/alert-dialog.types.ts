export interface UseAlertDialogProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Called when the action button is clicked. */
	onAction?: () => void;
	/** Called when the cancel button is clicked. */
	onCancel?: () => void;
}

export interface UseAlertDialogReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: Record<string, unknown>;
	readonly overlay: Record<string, unknown>;
	readonly content: Record<string, unknown>;
	readonly title: Record<string, unknown>;
	readonly description: Record<string, unknown>;
	readonly cancel: Record<string, unknown>;
	readonly action: Record<string, unknown>;
	attachContent: (node: HTMLDialogElement) => { destroy(): void };
	attachOverlay: (node: HTMLElement) => { destroy(): void };
}
