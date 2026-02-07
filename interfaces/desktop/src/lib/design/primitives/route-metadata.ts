/**
 * @file primitives/route-metadata.ts
 * @layer primitives
 *
 * Route metadata registry for smart primitives (Breadcrumb, Sidebar, NavMenu).
 * Uses dependency injection pattern - primitives export types + access API only.
 * App owns and injects the data.
 *
 * CRITICAL: Never infer labels from URL segments.
 */

// ============================================
// TYPES
// ============================================

export interface RouteMetadata {
	/** Human-readable label (i18n-ready) */
	label: string;
	/** Optional icon identifier */
	icon?: string;
	/** Parent route path for breadcrumb hierarchy */
	parent?: string;
	/** Exclude from navigation */
	hidden?: boolean;
}

// ============================================
// REGISTRY (Injected by app, not owned here)
// ============================================

let _injectedRegistry: Record<string, RouteMetadata> = {};

/**
 * Get metadata for a route path.
 * Returns undefined if not found (use fallback).
 */
export function getRouteMetadata(path: string): RouteMetadata | undefined {
	return _injectedRegistry[path];
}

/**
 * Inject the route registry from the app layer.
 * Call this once at app initialization.
 *
 * @example
 * // In your app's root layout or init
 * import { setRouteRegistry } from '$lib/design/primitives';
 *
 * setRouteRegistry({
 *   "/": { label: "Home" },
 *   "/dashboard": { label: "Dashboard", parent: "/" },
 *   "/settings": { label: "Settings", parent: "/" },
 * });
 */
export function setRouteRegistry(registry: Record<string, RouteMetadata>): void {
	_injectedRegistry = registry;
}

/**
 * Clear the registry (useful for testing).
 */
export function clearRouteRegistry(): void {
	_injectedRegistry = {};
}
