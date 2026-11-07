/**
 * @file primitives/_internal/index.ts
 * @layer primitives
 *
 * Internal utilities re-exported from bits-ui.
 * This layer isolates us from bits-ui internal path changes.
 *
 * WARNING: These are bits-ui internals, not public API.
 * Paths may change in minor versions. This file is the single
 * point of update if that happens.
 */

// ============================================
// PUBLIC API (stable, safe to use)
// ============================================

// Portal - renders children outside DOM hierarchy
export { Portal } from "bits-ui";

// Keyboard detection
export { IsUsingKeyboard } from "bits-ui";

// ID generation
export { useId } from "bits-ui";

// Props merging (from svelte-toolbelt via bits-ui)
export { mergeProps } from "bits-ui";

// ============================================
// INTERNAL UTILITIES (unstable paths)
// ============================================

// Floating arrow for positioned content (Popover, Tooltip, Select, Menu)
export { default as FloatingLayerArrow } from "bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-arrow.svelte";

// Presence layer for mount/unmount animations
export { default as PresenceLayer } from "bits-ui/dist/bits/utilities/presence-layer/presence-layer.svelte";

// Focus scope for focus trapping
export { default as FocusScope } from "bits-ui/dist/bits/utilities/focus-scope/focus-scope.svelte";

// Dismissible layer for click-outside detection
export { default as DismissibleLayer } from "bits-ui/dist/bits/utilities/dismissible-layer/dismissible-layer.svelte";

// Escape layer for escape key handling
export { default as EscapeLayer } from "bits-ui/dist/bits/utilities/escape-layer/escape-layer.svelte";

// Scroll lock to prevent body scroll
export { default as ScrollLock } from "bits-ui/dist/bits/utilities/scroll-lock/scroll-lock.svelte";

// Text selection layer
export { default as TextSelectionLayer } from "bits-ui/dist/bits/utilities/text-selection-layer/text-selection-layer.svelte";

// Visually hidden for screen readers
export { default as VisuallyHidden } from "bits-ui/dist/bits/utilities/visually-hidden/visually-hidden.svelte";

// Generic arrow (just SVG, no positioning)
export { default as Arrow } from "bits-ui/dist/bits/utilities/arrow/arrow.svelte";

// Mounted utility
export { default as Mounted } from "bits-ui/dist/bits/utilities/mounted.svelte";
