export interface UseSelectProps {
	value?: string;
	onValueChange?: (value: string) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	disabled?: boolean;
	required?: boolean;
	placeholder?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
}

export interface UseSelectReturn {
	readonly value: string;
	readonly open: boolean;
	readonly highlightedId: string | null;
	setOpen(value: boolean): void;
	readonly root: Record<string, unknown>;
	readonly trigger: Record<string, unknown>;
	readonly valueDisplay: Record<string, unknown>;
	readonly listbox: Record<string, unknown>;
	readonly label: Record<string, unknown>;
	getOption(
		optionValue: string,
		options?: { disabled?: boolean; label?: string },
	): Record<string, unknown>;
	attachListbox: (node: HTMLElement) => { destroy(): void };
}
