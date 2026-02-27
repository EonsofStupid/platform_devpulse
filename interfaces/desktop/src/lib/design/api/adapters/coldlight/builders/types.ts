/**
 * @file builders/_internal/types.ts
 * @package @devpulse/coldlight
 *
 * Shared types for all ColdLight builders.
 * Mirrors melt's internal type vocabulary exactly.
 */

/** Value or getter — reactive when getter, static when value. */
export type MaybeGetter<T> = T | (() => T);

/** Loose attribute type for external consumers who accept any builder output. */
export type BuilderAttrs = Record<string, unknown>;

/** Alias for BuilderAttrs — used by mergeAttrs and slot spreading. */
export type SlotAttrs = BuilderAttrs;

/** Standard data-state values used across builders. */
export type DataState = "on" | "off" | "active" | "inactive" | "open" | "closed";

/** Direction for keyboard navigation. */
export type Direction = "ltr" | "rtl";

/** Orientation for keyboard navigation + aria-orientation. */
export type Orientation = "horizontal" | "vertical";
