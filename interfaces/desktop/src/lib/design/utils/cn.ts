/**
 * @file utils/cn.ts
 * @package @devpulse/coldlight
 *
 * Merge class names. Filters falsy values. ColdLight's class composition utility.
 */
export function cn(...inputs: (string | false | null | undefined)[]): string {
	return inputs.filter(Boolean).join(" ");
}
