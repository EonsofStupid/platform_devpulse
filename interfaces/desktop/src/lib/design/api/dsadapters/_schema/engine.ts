/**
 * @file Engine Types — Universal Adapter Contract
 * @package @devpulse/coldlight
 *
 * THE keystone type. Every adapter — MeltUI or ColdLight-owned —
 * returns this exact shape. Components never know which engine is behind it.
 *
 * Schema.engine → resolveAdapter() → AdapterResult
 * That's the whole chain. ColdLight is the ONLY public API.
 */

// =============================================================================
// ENGINE TYPE — which adapter implementation backs this primitive
// =============================================================================

export type EngineType = "meltui" | "coldlight";

// =============================================================================
// ADAPTER RESULT — the universal contract every adapter returns
// =============================================================================

/**
 * Universal adapter result. Every adapter, whether MeltUI or ColdLight-owned,
 * exports this exact shape. The component never sees the implementation.
 *
 * - `states`: reactive boolean state per declared state token
 * - `attrs`: per-slot ARIA attribute records (role, aria-*, tabindex, etc.)
 * - `handlers`: per-slot event handler records (click, keydown, etc.)
 * - `context`: optional shared context for compound components
 */
export interface AdapterResult {
	/** Reactive state per declared state token (disabled, pressed, expanded, etc.) */
	readonly states: Record<string, { get current(): boolean; set current(v: boolean) }>;

	/** Per-slot ARIA attribute records — spread directly onto elements */
	readonly attrs: Record<string, Record<string, string | undefined>>;

	/** Per-slot event handler records — spread directly onto elements */
	readonly handlers: Record<string, Record<string, (e: Event) => void>>;

	/** Optional shared context for compound components (accordion items, tab panels) */
	readonly context?: Record<string, unknown>;
}

// =============================================================================
// COMPONENT SCHEMA — the SSOT that drives adapter resolution
// =============================================================================

/**
 * ComponentSchema — the SSOT declaration for any ColdLight primitive.
 * The `engine` field tells the resolver which adapter to load.
 * Scanner validates: if engine is "meltui", adapter folder MUST exist.
 */
export interface ComponentSchema {
	/** Primitive kind identifier */
	readonly kind: string;

	/** Which adapter engine backs this primitive */
	readonly engine: EngineType;

	/** Declared slot names */
	readonly slots: readonly string[];

	/** Declared state tokens */
	readonly states: readonly string[];

	/** Required ARIA attributes */
	readonly aria: readonly string[];

	/** Declared keyboard/pointer interactions */
	readonly interactions: readonly string[];
}

// =============================================================================
// ADAPTER FACTORY — what each adapter module exports
// =============================================================================

/**
 * Every adapter module exports a factory function matching this signature.
 * The factory receives component props and returns the universal AdapterResult.
 */
export type AdapterFactory<TProps = Record<string, unknown>> = (
	props?: TProps,
) => AdapterResult;
