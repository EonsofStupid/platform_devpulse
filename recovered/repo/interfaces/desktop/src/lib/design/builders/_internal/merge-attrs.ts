/**
 * @file builders/_internal/merge-attrs.ts
 * @package @devpulse/coldlight
 *
 * Attribute object composition — merges N spread-able attr objects.
 * Mirrors melt's mergeAttrs exactly.
 *
 * Smart handling:
 * - Event handlers (onclick, onfocus, etc.): both fire in sequence
 * - style: concatenated with ";"
 * - class: concatenated with " "
 * - Everything else: last-wins
 * - Svelte bug workaround: false hidden/disabled are deleted
 */

import { isFunction, isString, isEventHandler } from "./is.js";
import type { SlotAttrs } from "./types.js";

/** Compose two event handlers so both fire in sequence. */
function composeHandlers(
	a: (...args: unknown[]) => unknown,
	b: (...args: unknown[]) => unknown,
): (...args: unknown[]) => void {
	return (...args: unknown[]) => {
		a(...args);
		b(...args);
	};
}

/**
 * Merge multiple attribute objects into one.
 * Event handlers are chained. Styles are concatenated. Class strings are joined.
 * Everything else is last-wins.
 */
export function mergeAttrs(...args: SlotAttrs[]): SlotAttrs {
	if (args.length === 0) return {};
	const result: SlotAttrs = { ...args[0] };

	for (let i = 1; i < args.length; i++) {
		const props = args[i];
		for (const key in props) {
			const a = result[key];
			const b = props[key];

			if (isFunction(a) && isFunction(b) && isEventHandler(key)) {
				// Both are event handlers → chain them
				result[key] = composeHandlers(
					a as (...args: unknown[]) => unknown,
					b as (...args: unknown[]) => unknown,
				);
			} else if (isFunction(a) && isFunction(b)) {
				// Both are functions (non-event) → chain them
				result[key] = composeHandlers(
					a as (...args: unknown[]) => unknown,
					b as (...args: unknown[]) => unknown,
				);
			} else if (key === "style" && isString(a) && isString(b)) {
				// Style strings → concatenate with ";"
				result[key] = `${a};${b}`;
			} else if (key === "class" && isString(a) && isString(b)) {
				// Class strings → concatenate with " "
				result[key] = `${a} ${b}`;
			} else {
				// Everything else → last-wins
				result[key] = b !== undefined ? b : a;
			}
		}
	}

	// Svelte bug: hidden/disabled false still renders as attribute
	if (result["hidden"] !== true) delete result["hidden"];
	if (result["disabled"] !== true) delete result["disabled"];

	return result;
}
