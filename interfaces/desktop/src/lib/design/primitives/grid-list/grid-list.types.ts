export interface UseGridListProps {
	selectedKeys?: Set<string>;
	onSelectionChange?: (keys: Set<string>) => void;
	multiple?: boolean;
	disabled?: boolean;
	"aria-label"?: string;
}

export interface UseGridListReturn {
	readonly root: Record<string, unknown>;
	getItem(key: string, options?: { disabled?: boolean }): Record<string, unknown>;
}
