/**
 * @file Latest blocks barrel.
 * @module @devpulse/design/blocks/latest
 *
 * Surfaces composed by the `/latest` route. `LatestUpdateCard` is the
 * canonical card for "this build's update status" — anything that wants
 * to expose the same affordances elsewhere (settings, status bar
 * affordance) should reuse the same block, not re-render the state.
 */

export { default as LatestUpdateCard } from "./LatestUpdateCard.svelte";
