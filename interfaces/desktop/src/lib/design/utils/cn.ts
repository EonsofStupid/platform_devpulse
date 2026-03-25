/**
 * @file utils/cn.ts
 * @package @devpulse/coldlight
 *
 * Merge class names. Filters falsy values. ColdLight's class composition utility.
 */
import clsx from "clsx";
import type { ClassValue } from "svelte/elements";
import type { ClassValue as ClsxClassValue } from "clsx";

export type { ClassValue } from "svelte/elements";

export function cn(...inputs: ClsxClassValue[]): string {
	return clsx(...inputs);
}

/** Base props for any element that accepts a class. */
export interface BaseProps {
	class?: ClassValue | undefined | null;
}
