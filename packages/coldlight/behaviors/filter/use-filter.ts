/**
 * useFilter — ColdLight utility primitive.
 *
 * Returns locale-aware string matching functions (contains, startsWith, endsWith)
 * using Intl.Collator for proper Unicode comparison.
 *
 * No Svelte runes needed — pure functions, no reactivity.
 *
 * @example
 * ```typescript
 * import { useFilter } from '#coldlight/coldlight';
 * const filter = useFilter({ sensitivity: 'base' });
 * filter.contains('Cafe', 'cafe'); // true (base sensitivity ignores case)
 * filter.startsWith('Hello World', 'hello'); // true
 * ```
 */

import type { UseFilterProps, UseFilterReturn } from "./filter.types.js";

export function useFilter(props: UseFilterProps = {}): UseFilterReturn {
	const sensitivity = props.sensitivity ?? "base";
	const collator = new Intl.Collator(undefined, { sensitivity, usage: "search" });

	function contains(string: string, substring: string): boolean {
		if (substring.length === 0) return true;
		if (string.length === 0) return false;

		// Normalize for consistent comparison
		const normalizedString = string.normalize("NFC");
		const normalizedSubstring = substring.normalize("NFC");

		// Slide a window of substring length across the string
		for (let i = 0; i <= normalizedString.length - normalizedSubstring.length; i++) {
			const slice = normalizedString.slice(i, i + normalizedSubstring.length);
			if (collator.compare(slice, normalizedSubstring) === 0) {
				return true;
			}
		}
		return false;
	}

	function startsWith(string: string, substring: string): boolean {
		if (substring.length === 0) return true;
		if (string.length < substring.length) return false;

		const normalizedString = string.normalize("NFC");
		const normalizedSubstring = substring.normalize("NFC");
		const slice = normalizedString.slice(0, normalizedSubstring.length);
		return collator.compare(slice, normalizedSubstring) === 0;
	}

	function endsWith(string: string, substring: string): boolean {
		if (substring.length === 0) return true;
		if (string.length < substring.length) return false;

		const normalizedString = string.normalize("NFC");
		const normalizedSubstring = substring.normalize("NFC");
		const slice = normalizedString.slice(-normalizedSubstring.length);
		return collator.compare(slice, normalizedSubstring) === 0;
	}

	return { contains, startsWith, endsWith };
}
