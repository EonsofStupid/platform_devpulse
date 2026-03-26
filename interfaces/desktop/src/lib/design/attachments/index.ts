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

// Focus management
export { focusTrap, focusReturn, rovingFocus, type RovingFocusOptions } from "./focus/index.js";

// Dismiss triggers
export { clickOutside, escapeKey } from "./dismiss/index.js";

// Keyboard interaction
export { keyboardHandler, typeahead, type KeyMap, type TypeaheadOptions } from "./keyboard/index.js";

// Accessibility wiring
export { ariaAttrs, ariaLink, type AriaAttrsOptions, type AriaState, type AriaLinkOptions, type AriaLinkType } from "./aria/index.js";

// Layout / DOM manipulation
export { portal, visuallyHidden, scrollLock } from "./layout/index.js";

// Browser observer APIs
export { intersection, resize, mediaQuery, overflow, type IntersectionOptions, type ResizeOptions, type MediaQueryOptions, type OverflowOptions, type OverflowState } from "./observer/index.js";
