/**
 * @file Adapter Resolver — Schema-Driven Engine Selection
 * @package @devpulse/coldlight
 *
 * THE resolver. Reads schema.engine → loads the correct adapter → returns AdapterResult.
 * Components call resolveAdapter(schema) and get back { states, attrs, handlers, context }.
 * They never know if MeltUI or ColdLight is behind it.
 *
 * Scanner validates parity: if engine: "meltui", the folder
 * api/adapters/meltui/_internal/{kind}/ MUST exist or the build fails.
 */

import type { AdapterFactory, AdapterResult, ComponentSchema } from "./_schema/engine.js";

// =============================================================================
// ADAPTER REGISTRY — lazily populated, O(1) lookup after first resolve
// =============================================================================

const adapterCache = new Map<string, AdapterFactory>();

// =============================================================================
// RESOLVER
// =============================================================================

/**
 * Resolve the adapter for a given component schema.
 *
 * Reads schema.engine and dynamically imports the correct adapter factory.
 * Returns the universal AdapterResult — the component never sees the engine.
 *
 * @example
 * ```typescript
 * import { ButtonSchema } from "$lib/design/schema/button.schema";
 * const adapter = await resolveAdapter(ButtonSchema);
 * const { attrs, handlers, states } = adapter({ disabled });
 * ```
 */
export async function resolveAdapter<TProps = Record<string, unknown>>(
	schema: ComponentSchema,
): Promise<AdapterFactory<TProps>> {
	const cacheKey = `${schema.engine}:${schema.kind}`;

	const cached = adapterCache.get(cacheKey);
	if (cached) return cached as AdapterFactory<TProps>;

	let factory: AdapterFactory<TProps>;

	if (schema.engine === "meltui") {
		const mod = await import(
			/* @vite-ignore */
			`./meltui/_internal/${schema.kind}/adapter.ts`
		);
		factory = (mod.createAdapter ?? mod.default) as AdapterFactory<TProps>;
	} else {
		const mod = await import(
			/* @vite-ignore */
			`./coldlight/_internal/${schema.kind}/adapter.ts`
		);
		factory = (mod.createAdapter ?? mod.default) as AdapterFactory<TProps>;
	}

	adapterCache.set(cacheKey, factory as AdapterFactory);
	return factory;
}

/**
 * Synchronous resolver for adapters that are already registered.
 * Use when the adapter has been pre-loaded (e.g., during SSR or build).
 * Returns null if the adapter hasn't been loaded yet.
 */
export function resolveAdapterSync<TProps = Record<string, unknown>>(
	schema: ComponentSchema,
): AdapterFactory<TProps> | null {
	const cacheKey = `${schema.engine}:${schema.kind}`;
	const cached = adapterCache.get(cacheKey);
	return cached ? (cached as AdapterFactory<TProps>) : null;
}

/**
 * Pre-register an adapter factory. Used by eager-loaded adapters
 * or during build-time adapter collection.
 */
export function registerAdapter(
	engine: ComponentSchema["engine"],
	kind: string,
	factory: AdapterFactory,
): void {
	adapterCache.set(`${engine}:${kind}`, factory);
}
