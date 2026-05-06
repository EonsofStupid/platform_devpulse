/**
 * @module @devpulse/devtools/clyffy/reasoning/rrd
 *
 * Public API for the RRD devtool. Routes mount RrdDevtool; cross-domain
 * surfaces import the rune state from `$lib/sys/data-access/rrd/`.
 */

export { type RrdTransition, rrdState } from "$lib/sys/data-access/rrd/rrd.state.svelte.js";
export { default as RrdDevtool } from "./feature/RrdDevtool.svelte";
