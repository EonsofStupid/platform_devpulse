/**
 * @file Prepared Component Base Types
 * @module @devpulse/coldlight/components/_base/types
 * @layer components
 *
 * Every prepared ColdLight component extends PreparedComponentProps.
 * This gives every component the 8-axis visual system, radius, size,
 * and class composition — all type-safe, all schema-driven.
 */

import type { Snippet } from "svelte";
import type {
	ColdLightProps,
	ResolvedVisual,
} from "$lib/design/registry/resolve-visual.js";

/**
 * Base props that EVERY prepared ColdLight component receives.
 *
 * Components extend this with their kind-specific props:
 * ```typescript
 * interface ButtonComponentProps extends PreparedComponentProps {
 *   intent?: ButtonIntent;
 *   pressed?: boolean;
 *   loading?: boolean;
 * }
 * ```
 */
export interface PreparedComponentProps extends ColdLightProps {
	/** User-provided CSS classes — merged after ColdLight resolution */
	class?: string;
	/** Children snippet */
	children?: Snippet;
}

/**
 * Per-kind default presets.
 * Registered by each component kind — defines what visual config
 * a component starts with when no props are provided.
 */
export interface ComponentDefaults {
	readonly kind: string;
	readonly defaultPreset: string;
}

/** Re-export for convenience */
export type { ColdLightProps, ResolvedVisual };
