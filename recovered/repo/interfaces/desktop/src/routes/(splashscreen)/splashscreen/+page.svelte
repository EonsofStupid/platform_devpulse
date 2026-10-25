<!--
	@route /splashscreen
	Dual-mode boot progress UI.
	Dev mode: raw technical output (TechnicalBootView)
	Production mode: friendly progress (FriendlyBootView)

	Tauri splashscreen window loads this route while Platform::boot() runs.
	Events arrive via Tauri event bridge ("platform:boot" / "platform:boot-complete").
-->
<script lang="ts">
import { listen } from "@tauri-apps/api/event";
import { onMount } from "svelte";
import { bootState } from "$lib/sys/runes/bootState.svelte.js";
import { flags } from "$lib/sys/cfg/flags.js";
import type { InitEvent } from "$lib/sys/generated/init.types.js";
import TechnicalBootView from "./TechnicalBootView.svelte";
import FriendlyBootView from "./FriendlyBootView.svelte";

onMount(() => {
	const unlistenBoot = listen<InitEvent>("platform:boot", (e) => {
		bootState.addEvent(e.payload);
	});
	const unlistenComplete = listen("platform:boot-complete", () => {
		bootState.markComplete();
	});

	return () => {
		unlistenBoot.then((fn) => fn());
		unlistenComplete.then((fn) => fn());
	};
});
</script>

{#if flags.DEV_MODE}
	<TechnicalBootView />
{:else}
	<FriendlyBootView />
{/if}
