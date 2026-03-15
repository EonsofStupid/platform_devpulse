<script lang="ts">
import "../app.css";
import "$lib/design/recipes/layouts/shell/index.js";
import "$lib/design/recipes/blocks/widget/index.js";
import "$lib/design/recipes/components/index.js";
import SvgFilters from "$lib/design/svg/filters/SvgFilters.svelte";
import BootOverlay from "$lib/layouts/app/BootOverlay.svelte";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import { logInfo, logError } from "$lib/sys/logger.js";
import { onMount } from "svelte";

let { children } = $props();

onMount(() => {
	logInfo("layout", "Root layout mounted");
	logInfo("layout", `__TAURI_INTERNALS__: ${typeof (window as any).__TAURI_INTERNALS__}`);
	platformState.init()
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
