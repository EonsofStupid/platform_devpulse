export type TextFieldType = "text" | "email" | "password" | "url" | "tel";

export interface UseTextFieldProps {
	/** Current value. */
	value?: string;
	/** Callback on value change. */
	onValueChange?: (value: string) => void;
	/** Input type. Default: "text". */
	type?: TextFieldType;
	/** Placeholder text. */
	placeholder?: string;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	invalid?: boolean;
	/** Error message (links to error slot via aria-describedby when invalid). */
	error?: string;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
	"aria-errormessage"?: string;
}

export interface UseTextFieldReturn {
	readonly value: string;
	readonly root: Record<string, unknown>;
	readonly input: Record<string, unknown>;
	readonly label: Record<string, unknown>;
	readonly description: Record<string, unknown>;
	readonly error: Record<string, unknown>;
	focus(): void;
	clear(): void;
}
