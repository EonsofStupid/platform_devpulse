/**
 * useFilter — prop and return types.
 *
 * Returns locale-aware string matching functions using Intl.Collator.
 */

export interface UseFilterProps {
	/** Collator sensitivity level. Default: "base". */
	sensitivity?: "base" | "accent" | "case" | "variant";
}

export interface UseFilterReturn {
	/** Returns true if `string` contains `substring`. */
	contains(string: string, substring: string): boolean;
	/** Returns true if `string` starts with `substring`. */
	startsWith(string: string, substring: string): boolean;
	/** Returns true if `string` ends with `substring`. */
	endsWith(string: string, substring: string): boolean;
}
