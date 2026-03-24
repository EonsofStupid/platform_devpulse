/**
 * @file utils/cn.ts
 * @package @devpulse/coldlight
 *
 * Merge class names. Filters falsy values. ColdLight's class composition utility.
 */
export function cn(...inputs: (string | false | null | undefined)[]): string {
	return inputs.filter(Boolean).join(" ");
}

/** Base props for any element that accepts a class. */
export interface BaseProps {
	class?: string | undefined;
}
