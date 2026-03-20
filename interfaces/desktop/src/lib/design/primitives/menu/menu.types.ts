export interface UseMenuProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Called when a menu item is selected. */
	onSelect?: (value: string) => void;
	"aria-label"?: string;
}

export interface UseMenuReturn {
	readonly open: boolean;
	setOpen(value: boolean): void;
	readonly trigger: Record<string, unknown>;
	readonly content: Record<string, unknown>;
	readonly separator: Record<string, unknown>;
	getItem(value: string, options?: { disabled?: boolean }): Record<string, unknown>;
	getGroup(label: string): Record<string, unknown>;
	attachContent: (node: HTMLElement) => { destroy(): void };
}
