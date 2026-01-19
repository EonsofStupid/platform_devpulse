<!--
  @file src/lib/sys/debug/vpb/VPB.svelte
  @name VPB.svelte
  @module @devpulse/sys/debug/vpb/VPB
  @layer lib

  @description
  Root VPB component.
  Mounts:
  - VPBPanel (Controller)
  - VPBInspector (Floating Window)
  - ScanOverlay (Interaction Layer)
  - VPBToast (Notifications)

  @dependencies
  - VPBPanel
  - VPBInspector
  - VPBToast
  - ScanOverlay
  - vpb.state.ts
-->
<script lang="ts">
  import { __DEV__ } from "../DEBUG_FLAG";
  import { vpb } from "./state/vpb.svelte";
  import VPBPanel from "./components/VPBPanel.svelte";
  import VPBToast from "./components/VPBToast.svelte";
  import ScanOverlay from "./components/inspector/ScanOverlay.svelte";
</script>

{#if __DEV__}
  <!-- Toast notifications -->
  <VPBToast />

  <!-- Scan overlay (when active) -->
  <ScanOverlay />

  <!-- Main Controller Panel -->
  <VPBPanel />
{/if}
