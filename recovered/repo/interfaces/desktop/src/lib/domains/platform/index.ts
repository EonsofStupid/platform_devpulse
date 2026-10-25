/**
 * Platform domain — devtool-side data access and shared devtool chrome
 * for every Module-Charter service.
 *
 * Organization mirrors the five-axis taxonomy from the engine:
 * `runtime/`, `stores/`, `runtimes/`, `capabilities/`, `integrations/`.
 * As each module gains a charter-compliant devtool, its domain folder
 * is added here and re-exported from this barrel.
 *
 * Shared primitives (the 4-tab shell, health types) live in
 * [_shared](./_shared/index.ts).
 */

export * from "./_shared/index.js";
