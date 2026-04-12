<script lang="ts">
import "../app.css";
// Style presets compiled via SD5 DTCG pipeline → components.generated.css
// Loaded via app.css → design/index.css → css/index.css import chain
import { onMount } from "svelte";
import TokenDebugOverlay from "$lib/design/debug/TokenDebugOverlay.svelte";
import SvgFilters from "$lib/design/svg/filters/SvgFilters.svelte";
import { bootstrapDownloadBridge } from "$lib/domains/app/models/features/setup-wizard/download-bootstrap.js";
import BootOverlay from "$lib/layouts/app/BootOverlay.svelte";
import { installGlobalHandlers, logError, logInfo } from "$lib/sys/logger.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let { children } = $props();

onMount(() => {
	// Capture ALL frontend errors, warnings, promise rejections from the very start.
	// Everything goes to the Rust tracing pipeline → session JSONL.
	installGlobalHandlers();
	logInfo("layout", "Root layout mounted");
	// biome-ignore lint/suspicious/noExplicitAny: Tauri injects __TAURI_INTERNALS__ on window
	logInfo("layout", `__TAURI_INTERNALS__: ${typeof (window as any).__TAURI_INTERNALS__}`);

	// Single subscription point for every kernel model-loader event —
	// downloads, loads, cancels. Routes through wizardState rune methods
	// so the overlay reflects live state whether it is currently open or
	// dismissed. Attached here (root layout) so downloads started before
	// the overlay opens still populate when the overlay mounts.
	let detachDownloadBridge: (() => void) | null = null;
	bootstrapDownloadBridge()
		.then((detach) => {
			detachDownloadBridge = detach;
			logInfo("layout", "download-bridge attached");
		})
		.catch((e) => {
			logError("layout", `download-bridge FAILED to attach: ${e}`);
		});

	platformState
		.init()
		.then(() => {
			logInfo("layout", `platformState.init() complete — phase: ${platformState.phase}`);
		})
		.catch((e) => {
			logError("layout", `platformState.init() FAILED: ${e}`);
		});

	return () => {
		detachDownloadBridge?.();
		platformState.destroy();
	};
});
</script>

<SvgFilters />
<BootOverlay />
<TokenDebugOverlay />
{@render children()}
