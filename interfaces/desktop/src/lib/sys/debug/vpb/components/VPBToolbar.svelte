<!--
  @file src/lib/sys/debug/vpb/components/VPBToolbar.svelte
  @name VPBToolbar.svelte
  @module @devpulse/sys/debug/vpb/components/VPBToolbar
  @layer lib

  @description
  [TODO: Describe this component's purpose]

  @props
  - [TODO: propName]: [type] - [description]

  @dependencies
  - [TODO: List imports]

  @consumers
  - [TODO: List who uses this component]

  @vpb-editable [TODO: List editable props]
  @since 1.0.0
-->
<!--
  VPBToolbar.svelte
  Play/Pause/Stop controls - uses recipes from lib/design/vpb-toolbar.css
-->
<script lang="ts">
    import { vpb } from "../state/vpb.svelte";
    import { toast } from "svelte-sonner";

    let stopAttempts = $state(0);

    function handlePlay() {
        if (vpb.scanPaused) {
            vpb.resumeScan();
            toast.info("Scan resumed");
        } else {
            vpb.startScan();
            toast.info("Scan started - hover over elements");
        }
        stopAttempts = 0;
    }

    function handlePause() {
        vpb.pauseScan();
        toast.info("Scan paused - browse freely");
    }

    function handleStop() {
        stopAttempts++;

        if (stopAttempts >= 2) {
            vpb.stopScan();
            toast.warning("Scan force stopped");
            stopAttempts = 0;
        } else {
            vpb.stopScan();
            toast.info("Scan stopped");
        }
    }

    function handleFloat() {
        if (vpb.mode === "floating") {
            vpb.dock();
            toast.info("Panel docked");
        } else {
            vpb.setPosition(window.innerWidth - 340, window.innerHeight - 240);
            vpb.float();
            toast.info("Panel floating - drag to move");
        }
    }

    function handleMinimize() {
        vpb.minimize();
        toast.info("VPB minimized - click V icon to restore");
    }

    function handleClose() {
        vpb.stopScan();
        vpb.minimize();
    }
</script>

<div class="vpb-toolbar" role="toolbar" aria-label="VPB Controls">
    <!-- Play/Resume -->
    <button
        class="vpb-btn vpb-btn--play"
        data-active={vpb.scanActive && !vpb.scanPaused}
        onclick={handlePlay}
        disabled={vpb.scanActive && !vpb.scanPaused}
        aria-label={vpb.scanPaused ? "Resume scan" : "Start scan"}
        title={vpb.scanPaused ? "Resume scan" : "Start scan"}
    >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2.5v11l9-5.5L4 2.5z" />
        </svg>
    </button>

    <!-- Pause -->
    <button
        class="vpb-btn vpb-btn--pause"
        onclick={handlePause}
        disabled={!vpb.scanActive || vpb.scanPaused}
        aria-label="Pause scan"
        title="Pause scan"
    >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" />
            <rect x="9" y="2" width="4" height="12" />
        </svg>
    </button>

    <!-- Stop -->
    <button
        class="vpb-btn vpb-btn--stop"
        onclick={handleStop}
        disabled={!vpb.scanActive && !vpb.scanPaused}
        aria-label="Stop scan"
        title={stopAttempts >= 1 ? "Force stop" : "Stop scan"}
    >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10" />
        </svg>
    </button>

    <div class="vpb-toolbar__separator"></div>

    <!-- Float/Dock toggle -->
    <button
        class="vpb-btn"
        onclick={handleFloat}
        aria-label={vpb.mode === "floating" ? "Dock panel" : "Float panel"}
        title={vpb.mode === "floating" ? "Dock panel" : "Float panel"}
    >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            {#if vpb.mode === "floating"}
                <path d="M2 2h12v12H2V2zm2 2v8h8V4H4z" />
            {:else}
                <path
                    d="M2 2v5h2V4h3V2H2zm9 0v2h3v3h2V2h-5zM4 10v2h3v2H2v-5h2v1zm10-1v5h-5v-2h3v-3h2z"
                />
            {/if}
        </svg>
    </button>

    <!-- Minimize -->
    <button
        class="vpb-btn"
        onclick={handleMinimize}
        aria-label="Minimize panel"
        title="Minimize panel"
    >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="7" width="12" height="2" />
        </svg>
    </button>

    <!-- Close -->
    <button
        class="vpb-btn vpb-btn--close"
        onclick={handleClose}
        aria-label="Close panel"
        title="Close panel"
    >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path
                d="M3.5 3.5l9 9m0-9l-9 9"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
            />
        </svg>
    </button>
</div>
