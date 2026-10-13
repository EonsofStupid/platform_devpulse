/**
 * @file SchemaForm types — a form rendered from a JSON Schema.
 * @module @devpulse/design/blocks/schema-form
 *
 * The schema is generated from a Rust type (plan 0001 A2); Rust validates
 * every submission against the same schema and returns per-field errors.
 * This block holds no validation of its own: it renders fields, offers
 * suggestions, and shows the messages it is given.
 */

/** How a field is entered. */
export type SchemaInput = "text" | "email" | "folder";

/** One field, read from the schema. */
export interface SchemaField {
	name: string;
	input: SchemaInput;
	required: boolean;
	maxLength?: number;
}

/** A value offered for a field. */
export interface SchemaFormSuggestion {
	value: string;
	label: string;
}

/** Text for one field (from the copy catalog). */
export interface SchemaFormLabels {
	label: string;
	hint?: string;
}

export interface SchemaFormProps {
	/** The JSON Schema (an object with `properties`). */
	schema: unknown;
	/** Field names, in the order shown. */
	order: string[];
	/** Current values. */
	values: Record<string, string | null>;
	/** Label and hint per field. */
	labels: Record<string, SchemaFormLabels>;
	/** Error message per field (already turned into copy). */
	errors?: Record<string, string>;
	/** Suggested values per field. */
	suggestions?: Record<string, SchemaFormSuggestion[]>;
	/** Text of the folder picker button. */
	browseLabel?: string;
	disabled?: boolean;
	onChange: (field: string, value: string) => void;
	onBrowse?: (field: string) => void;
	onSubmit?: () => void;
}

type JsonObject = Record<string, unknown>;

const isObject = (v: unknown): v is JsonObject =>
	typeof v === "object" && v !== null && !Array.isArray(v);

/** Read the fields of a JSON Schema, in `order`. Unknown names are skipped. */
export function readFields(schema: unknown, order: string[]): SchemaField[] {
	if (!isObject(schema) || !isObject(schema.properties)) return [];
	const properties = schema.properties;
	const required = Array.isArray(schema.required) ? schema.required : [];
	return order.flatMap((name) => {
		const property = properties[name];
		if (!isObject(property)) return [];
		const input: SchemaInput =
			property["x-devpulse-input"] === "folder"
				? "folder"
				: property.format === "email"
					? "email"
					: "text";
		const maxLength = typeof property.maxLength === "number" ? property.maxLength : undefined;
		return [{ name, input, required: required.includes(name), maxLength }];
	});
}
