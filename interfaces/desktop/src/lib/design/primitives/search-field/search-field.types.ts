export interface UseSearchFieldProps {
	value?: string;
	onValueChange?: (value: string) => void;
	onClear?: () => void;
	placeholder?: string;
	disabled?: boolean;
	"aria-label"?: string;
	"aria-describedby"?: string;
}

export interface UseSearchFieldReturn {
	readonly value: string;
	readonly hasValue: boolean;
	readonly root: Record<string, unknown>;
	readonly input: Record<string, unknown>;
	readonly icon: Record<string, unknown>;
	readonly clear: Record<string, unknown>;
	clearValue(): void;
}
