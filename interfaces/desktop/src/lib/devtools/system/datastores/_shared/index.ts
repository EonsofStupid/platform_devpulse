/**
 * @file Datastore devtool shared visual primitives — barrel.
 * @module @devpulse/devtools/system/datastores/_shared
 *
 * Per-store devtools (DuckDB / libSQL / SurrealDB / Qdrant) consume
 * these primitives so the user sees a coherent visual language across
 * every store: same health-signal motion, same activity pulse, same
 * empty-state poster, same hero-card layout — only the accent color
 * and the hero visualization slot change per store.
 *
 * Out-of-bounds creation guard: this dir is the ONLY `_shared` allowed
 * under `system/datastores/` — feature-level shared bits belong in
 * their respective store directories, top-level shared bits belong
 * in `devtools/_shared/`.
 */

export { default as EmptyStatePoster } from "./EmptyStatePoster.svelte";
export { default as HealthSignal } from "./HealthSignal.svelte";
export { default as LiveActivityPulse } from "./LiveActivityPulse.svelte";
export { default as StoreHeroCard } from "./StoreHeroCard.svelte";
