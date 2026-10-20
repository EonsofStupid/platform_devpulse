/**
 * @file Containers domain — a container engine (Docker or Podman) for your projects.
 * @module @devpulse/domains/app/containers
 *
 * Rust detects, advises and runs each step (`platform::containers`); this
 * domain renders its `containers` state and sends your answers and clicks.
 */

export { containersState } from "./data-access/containers.state.svelte.js";
export { default as ContainersSetup } from "./feature/ContainersSetup.svelte";
