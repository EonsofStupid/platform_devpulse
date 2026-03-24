/**
 * @file utils/cn.ts
 * @package @devpulse/coldlight
 *
 * Merge class names. Filters falsy values. ColdLight's class composition utility.
 */
import clsx from "clsx";
import type { ClassValue } from "clsx";

export type { ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
	return clsx(...inputs);
}

/** Base props for any element that accepts a class. */
export interface BaseProps {
	class?: ClassValue | undefined | null;
}
