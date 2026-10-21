/**
 * @file Providers domain — the AI you bring: subscriptions and desktop apps.
 * @module @devpulse/domains/app/providers
 *
 * The kernel finds each provider and runs the vendor's own commands
 * (`devpulse_clyffy::providers`); the engine publishes the `providers` state;
 * this domain renders it and sends your clicks.
 */

export { providersState } from "./data-access/providers.state.svelte.js";
export { default as YourProviders } from "./feature/YourProviders.svelte";
