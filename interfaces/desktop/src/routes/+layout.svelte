<script lang="ts">
import "../app.css";
// biome-ignore lint/style/noRestrictedImports: root layout side-effect registration
import "$lib/design/recipes/layouts/shell/index.js";
// biome-ignore lint/style/noRestrictedImports: root layout side-effect registration
import "$lib/design/recipes/blocks/widget/index.js";
// biome-ignore lint/style/noRestrictedImports: root layout side-effect registration
import "$lib/design/recipes/components/index.js";
import { onMount } from "svelte";
import SvgFilters from "$lib/design/svg/filters/SvgFilters.svelte";
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
	platformState
		.init()
		.then(() => {
			logInfo("layout", `platformState.init() complete — phase: ${platformState.phase}`);
		})
		.catch((e) => {
			logError("layout", `platformState.init() FAILED: ${e}`);
		});
	return () => platformState.destroy();
});
</script>

<SvgFilters />
<BootOverlay />
{@render children()}
