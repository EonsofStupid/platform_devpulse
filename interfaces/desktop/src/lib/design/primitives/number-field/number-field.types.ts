export interface UseNumberFieldProps {
	value?: number;
	onValueChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	/** Human-readable value text (e.g., "$50.00" for aria-valuetext). */
	valueText?: string;
	"aria-label"?: string;
	"aria-describedby"?: string;
}

export interface UseNumberFieldReturn {
	readonly value: number;
	readonly canIncrement: boolean;
	readonly canDecrement: boolean;
	readonly root: Record<string, unknown>;
	readonly input: Record<string, unknown>;
	readonly increment: Record<string, unknown>;
	readonly decrement: Record<string, unknown>;
	incrementValue(): void;
	decrementValue(): void;
}
