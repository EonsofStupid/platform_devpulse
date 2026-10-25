export interface UseTagGroupProps {
	/** Current tag values. */
	values?: string[];
	/** Callback when a tag is removed. */
	onRemove?: (value: string) => void;
	disabled?: boolean;
	"aria-label"?: string;
}

export interface UseTagGroupReturn {
	readonly root: Record<string, unknown>;
	readonly label: Record<string, unknown>;
	readonly description: Record<string, unknown>;
	getTag(value: string, options?: { disabled?: boolean }): Record<string, unknown>;
	getRemove(value: string, options?: { disabled?: boolean }): Record<string, unknown>;
}
