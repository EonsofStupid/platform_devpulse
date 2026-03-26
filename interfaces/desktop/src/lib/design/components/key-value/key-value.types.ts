/**
 * @file KeyValue Types
 * @kind key-value
 * @render html
 * @category content
 */

export type KeyValueSize = "sm" | "md" | "lg";

export interface KeyValueProps {
	/** The label (key) */
	label: string;
	/** The value — string or number */
	value: string | number;
	/** Size variant */
	size?: KeyValueSize;
	/** Additional CSS classes */
	class?: string;
}
