export interface UseListBoxProps {
	/** Currently selected value(s). String for single, string[] for multiple. */
	value?: string | string[];
	onValueChange?: (value: string | string[]) => void;
	/** Allow multiple selection. Default: false. */
	multiple?: boolean;
	disabled?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
}

export interface UseListBoxReturn {
	readonly value: string | string[];
	readonly highlightedId: string | null;
	readonly root: Record<string, unknown>;
	getOption(
		optionValue: string,
		options?: { disabled?: boolean; label?: string },
	): Record<string, unknown>;
	getGroup(label: string): Record<string, unknown>;
}
