/**
 * @file Downloader feature barrel — orchestrating panel components.
 * @module @devpulse/domains/app/models/feature/downloader/feature
 *
 * Each panel is a phase view inside the ModelDownloaderOverlay. They
 * compose UI primitives from `../ui` with state from `../data-access`.
 * Mount the overlay shell, not these panels directly — they're not
 * useful in isolation.
 */

export { default as DownloaderConfirmPanel } from "./DownloaderConfirmPanel.svelte";
export { default as DownloaderProgressPanel } from "./DownloaderProgressPanel.svelte";
export { default as DownloaderSearchPanel } from "./DownloaderSearchPanel.svelte";
export { default as DownloaderTokenStrip } from "./DownloaderTokenStrip.svelte";
