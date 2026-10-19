/**
 * @file attachments/index.ts
 * @package @devpulse/coldlight
 * @layer attachment
 *
 * Svelte 5 attachments — reactive DOM bindings.
 * Replaces legacy Svelte actions (use:directive).
 *
 * Categories:
 *   focus/    — Focus trap, return, roving tabindex
 *   dismiss/  — Click outside, escape key
 *   keyboard/ — Key handler, typeahead
 *   aria/     — ARIA attribute application, relationship wiring
 *   layout/   — Portal, visually hidden, scroll lock
 *   observer/ — Intersection, resize, media query, overflow detection
 */

// Accessibility wiring
export {
	type AriaAttrsOptions,
	type AriaLinkOptions,
	type AriaLinkType,
	type AriaState,
	ariaAttrs,
	ariaLink,
} from "./aria/index.js";

// Dismiss triggers
export { clickOutside, escapeKey } from "./dismiss/index.js";
// Focus management
export { focusReturn, focusTrap, type RovingFocusOptions, rovingFocus } from "./focus/index.js";
// Keyboard interaction
export {
	type KeyMap,
	keyboardHandler,
	type TypeaheadOptions,
	typeahead,
} from "./keyboard/index.js";

// Layout / DOM manipulation
export { portal, scrollLock, visuallyHidden } from "./layout/index.js";

// Browser observer APIs
export {
	type IntersectionOptions,
	intersection,
	type MediaQueryOptions,
	mediaQuery,
	type OverflowOptions,
	type OverflowState,
	overflow,
	type ResizeOptions,
	resize,
} from "./observer/index.js";
