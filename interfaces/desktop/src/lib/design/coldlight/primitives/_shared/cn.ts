import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/** Strip inline style prop in DEV mode — ColdLight components never use inline styles. */
export function stripStyleProp(rest: Record<string, unknown>, name: string): void {
	if (import.meta.env?.DEV && "style" in rest) {
		console.warn(`[ColdLight] Inline style prop stripped from <${name}>`);
		delete rest.style;
	}
}
