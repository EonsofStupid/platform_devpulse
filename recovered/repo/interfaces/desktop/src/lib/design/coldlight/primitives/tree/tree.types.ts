export interface UseTreeProps {
	expandedKeys?: Set<string>;
	onExpandedChange?: (keys: Set<string>) => void;
	selectedKeys?: Set<string>;
	onSelectionChange?: (keys: Set<string>) => void;
	disabled?: boolean;
	"aria-label"?: string;
}

export interface UseTreeReturn {
	readonly root: Record<string, unknown>;
	getItem(
		key: string,
		options?: { hasChildren?: boolean; level?: number; disabled?: boolean },
	): Record<string, unknown>;
	getGroup(): Record<string, unknown>;
	toggleExpanded(key: string): void;
}
