<script lang="ts">
import "../app.css";
import "$lib/design/index.js";
import SvgFilters from "$lib/design/svg/filters/SvgFilters.svelte";
import BootOverlay from "$lib/layouts/app/BootOverlay.svelte";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import { onMount } from "svelte";

let { children } = $props();

console.log("[DevPulse] Root layout script executing");
console.log("[DevPulse] __TAURI_INTERNALS__:", typeof (window as any).__TAURI_INTERNALS__);

onMount(() => {
	console.log("[DevPulse] Root layout mounted");
	console.log("[DevPulse] __TAURI_INTERNALS__ at mount:", typeof (window as any).__TAURI_INTERNALS__);
	console.log("[DevPulse] Starting platformState.init()...");
	platformState.init()
		.then(() => {
			console.log("[DevPulse] platformState.init() completed, phase:", platformState.phase);
		})
		.catch((e) => {
			console.error("[DevPulse] platformState.init() FAILED:", e);
		});
	return () => platformState.destroy();
});
</script>

<SvgFilters />
<BootOverlay />
{@render children()}
