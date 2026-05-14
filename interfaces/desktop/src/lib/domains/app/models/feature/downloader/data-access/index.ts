/**
 * @file Downloader data-access barrel — state singleton.
 * @module @devpulse/domains/app/models/feature/downloader/data-access
 *
 * `modelDownloaderState` is the single instance every consumer reads
 * from + writes to. There is no per-call factory and no second
 * instance — opening over an already-open overlay just rebinds the
 * target context.
 */

export { modelDownloaderState } from "./downloader.state.svelte.js";
