/**
 * @file builders/_internal/is.ts
 * @package @devpulse/coldlight
 *
 * Type guards used across all builder utilities.
 * Mirrors melt's is.js — isFunction, isGetter, isString, isHTMLElement.
 */

/** Check if value is a function (getter or callback). */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
	return typeof value === "function";
}

/** Check if value is a getter (function that takes no args). */
export function isGetter<T>(value: unknown): value is () => T {
	return typeof value === "function";
}

/** Check if value is a string. */
export function isString(value: unknown): value is string {
	return typeof value === "string";
}

/** Check if value is an HTMLElement. */
export function isHTMLElement(value: unknown): value is HTMLElement {
	return value instanceof HTMLElement;
}

/** Check if value is iterable (but not a string). */
export function isIterable<T>(value: unknown): value is Iterable<T> {
	return value != null && typeof value === "object" && Symbol.iterator in value;
}

/** Check if a key name is an event handler (starts with "on"). */
export function isEventHandler(key: string): boolean {
	return key.length > 2 && key.startsWith("on") && key[2] === key[2]?.toLowerCase();
}
