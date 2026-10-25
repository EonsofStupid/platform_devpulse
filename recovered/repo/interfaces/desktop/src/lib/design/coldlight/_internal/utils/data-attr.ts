/**
 * Data attribute helpers for ColdLight primitives.
 *
 * Converts boolean/string values to HTML data attribute format:
 *   true  → "" (attribute present, no value)
 *   false → undefined (attribute absent from DOM)
 *   string → string (attribute with value)
 */

/** Boolean/string → data attribute value. */
export function dataAttr(value: boolean | string): "" | string | undefined {
	if (value === true) return "";
	if (value === false) return undefined;
	return value;
}

/** Boolean → aria-disabled attribute value. Uses `true` not `"true"` for proper ARIA. */
export function disabledAttr(value?: boolean): true | undefined {
	return value === true ? true : undefined;
}
