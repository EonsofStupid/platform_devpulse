<!--
  @file src/lib/sys/debug/vpb/VPB.svelte
  @name VPB.svelte
  @module @devpulse/sys/debug/vpb/VPB
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
  VPB.svelte
  Root VPB component - feature-gated, mounts all VPB sub-components
-->
<script lang="ts">
    import { __DEV__ } from "../DEBUG_FLAG";
    import { vpb } from "./state/vpb.svelte";
    import VPBPanel from "./components/VPBPanel.svelte";
    import VPBToast from "./components/VPBToast.svelte";
    import VPBInspector from "./components/VPBInspector.svelte";
    import ScanOverlay from "./scan/ScanOverlay.svelte";
</script>

{#if __DEV__}
    <!-- Toast notifications -->
    <VPBToast />

    <!-- Scan overlay (when active) -->
    <ScanOverlay />

    <!-- Main panel or minimized icon -->
    <VPBPanel />

    <!-- Inspector (when element selected) -->
    {#if vpb.mode !== "minimized"}
        <VPBInspector />
    {/if}
{/if}
