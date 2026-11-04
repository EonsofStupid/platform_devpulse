<!--
  @file src/lib/sys/debug/vpb/components/VpbToolbar.svelte
  @name VpbToolbar.svelte
  @module @devpulse/sys/debug/vpb/components/VPBToolbar
  @layer lib

  @description
  VPB Toolbar - Play/Pause/Stop and Float/Dock controls.
  No window controls (moved to Tabs header per strict user requirement).

  @dependencies
  - vpb-toolbar.css (global)
  - state/vpb.svelte.ts
  - svelte-sonner

  @since 1.0.0
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Separator } from "@devpulse/coldlight/components/separator";
import { Minimize2, Move, Pause, Play, Square } from "lucide-svelte";
import { toast } from "svelte-sonner";
import { copyState } from "#lib/sys/copy/index.js";
import { vpb } from "../state/vpb.svelte.js";

const text = $derived(copyState.catalog?.vpb);

let stopAttempts = $state(0);

function handlePlay() {
	if (vpb.scanPaused) {
		vpb.resumeScan();
		toast.info(text?.toast_scan_resumed ?? "");
	} else {
		vpb.startScan();
		toast.info(text?.toast_scan_started ?? "");
	}
	stopAttempts = 0;
}

function handlePause() {
	vpb.pauseScan();
	toast.info(text?.toast_scan_paused ?? "");
}

function handleStop() {
	stopAttempts++;

	if (stopAttempts >= 2) {
		vpb.stopScan();
		toast.warning(text?.toast_scan_force_stopped ?? "");
		stopAttempts = 0;
	} else {
		vpb.stopScan();
		toast.info(text?.toast_scan_stopped ?? "");
	}
}

function handleFloat() {
	if (vpb.mode === "floating") {
		vpb.dock();
		toast.info(text?.toast_docked ?? "");
	} else {
		vpb.setPosition(window.innerWidth - 340, window.innerHeight - 240);
		vpb.float();
		toast.info(text?.toast_floating ?? "");
	}
}
</script>

<div class="vpb-toolbar flex items-center gap-1" role="toolbar" aria-label={text?.controls_label}>
	<div class="vpb-btn-group flex items-center">
		<!-- Play/Resume -->
		<Button
			variant="ghost"
			size="sm"
			class="vpb-btn vpb-btn--play"
			data-active={vpb.scanActive && !vpb.scanPaused}
			onclick={handlePlay}
			disabled={vpb.scanActive && !vpb.scanPaused}
			aria-label={vpb.scanPaused ? text?.resume_scan : text?.start_scan}
			title={vpb.scanPaused ? text?.resume_scan : text?.start_scan}
		>
			<Play size={16} />
		</Button>

		<!-- Pause -->
		<Button
			variant="ghost"
			size="sm"
			class="vpb-btn vpb-btn--pause"
			onclick={handlePause}
			disabled={!vpb.scanActive || vpb.scanPaused}
			aria-label={text?.pause_scan}
			title={text?.pause_scan}
		>
			<Pause size={16} />
		</Button>

		<!-- Stop -->
		<Button
			variant="ghost"
			size="sm"
			class="vpb-btn vpb-btn--stop"
			onclick={handleStop}
			disabled={!vpb.scanActive && !vpb.scanPaused}
			aria-label={text?.stop_scan}
			title={stopAttempts >= 1 ? text?.force_stop : text?.stop_scan}
		>
			<Square size={16} />
		</Button>
	</div>

	<Separator orientation="vertical" class="vpb-toolbar__separator" />

	<!-- Float/Dock toggle -->
	<Button
		variant="ghost"
		size="sm"
		class="vpb-btn"
		onclick={handleFloat}
		aria-label={vpb.mode === "floating" ? text?.dock_panel : text?.float_panel}
		title={vpb.mode === "floating" ? text?.dock_panel : text?.float_panel}
	>
		{#if vpb.mode === "floating"}<Minimize2 size={16} />{:else}<Move size={16} />{/if}
	</Button>
</div>
