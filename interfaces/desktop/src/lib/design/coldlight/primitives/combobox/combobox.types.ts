export interface UseComboBoxProps {
	inputValue?: string;
	onInputChange?: (value: string) => void;
	selectedValue?: string;
	onSelectedChange?: (value: string) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	disabled?: boolean;
	placeholder?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
}

export interface UseComboBoxReturn {
	readonly inputValue: string;
	readonly selectedValue: string;
	readonly open: boolean;
	readonly highlightedId: string | null;
	setOpen(value: boolean): void;
	readonly root: Record<string, unknown>;
	readonly input: Record<string, unknown>;
	readonly trigger: Record<string, unknown>;
	readonly listbox: Record<string, unknown>;
	readonly label: Record<string, unknown>;
	getOption(optionValue: string, options?: { disabled?: boolean }): Record<string, unknown>;
	attachListbox: (node: HTMLElement) => { destroy(): void };
}
