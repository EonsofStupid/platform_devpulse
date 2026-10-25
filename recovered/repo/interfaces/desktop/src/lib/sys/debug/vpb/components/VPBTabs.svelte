<!--
  @file src/lib/sys/debug/vpb/components/VPBTabs.svelte
  @name VPBTabs.svelte
  @module @devpulse/sys/debug/vpb/components/VPBTabs
  @layer lib

  @description
  VPB Window Header using Bits UI Tabs.List.
  Contains Tab Triggers and Window Controls.

  @dependencies
  - bits-ui (Tabs)
  - vpb-tabs.css (global)
  - vpb.state.ts

  @since 1.0.0
-->
<script lang="ts">
    import { Tabs } from "bits-ui";
    import { vpb } from "../state/vpb.svelte";
</script>

<Tabs.List class="vpb-tabs">
    <!-- Main Tabs -->
    <Tabs.Trigger value="inspect" class="vpb-tab">Inspect</Tabs.Trigger>

    <Tabs.Trigger value="vpb" class="vpb-tab">VPB</Tabs.Trigger>

    <!-- Spacer acts as drag handle area with visual grip -->
    <div class="vpb-tabs__spacer" aria-label="Drag to move">
        <div class="vpb-drag-grip">
            <!-- 6-dot grip pattern -->
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                class="vpb-grip-icon"
            >
                <circle
                    cx="8"
                    cy="9"
                    r="1.5"
                    fill="currentColor"
                    fill-opacity="0.4"
                />
                <circle
                    cx="12"
                    cy="9"
                    r="1.5"
                    fill="currentColor"
                    fill-opacity="0.4"
                />
                <circle
                    cx="16"
                    cy="9"
                    r="1.5"
                    fill="currentColor"
                    fill-opacity="0.4"
                />
                <circle
                    cx="8"
                    cy="15"
                    r="1.5"
                    fill="currentColor"
                    fill-opacity="0.4"
                />
                <circle
                    cx="12"
                    cy="15"
                    r="1.5"
                    fill="currentColor"
                    fill-opacity="0.4"
                />
                <circle
                    cx="16"
                    cy="15"
                    r="1.5"
                    fill="currentColor"
                    fill-opacity="0.4"
                />
            </svg>
        </div>
    </div>

    <!-- Window Controls -->
    <div class="vpb-tabs__controls">
        <button
            class="vpb-tabs__control"
            onclick={() => vpb.minimize()}
            aria-label="Minimize to Icon"
            title="Minimize"
        >
            <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            >
                <path d="M2 8h8" stroke-linecap="round" />
            </svg>
        </button>

        <button
            class="vpb-tabs__control vpb-tabs__control--close"
            onclick={() => {
                vpb.stopScan();
                vpb.minimize();
            }}
            aria-label="Close Panel"
            title="Close"
        >
            <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
            >
                <path d="M3 3l6 6m0-6l-6 6" stroke-linecap="round" />
            </svg>
        </button>
    </div>
</Tabs.List>
