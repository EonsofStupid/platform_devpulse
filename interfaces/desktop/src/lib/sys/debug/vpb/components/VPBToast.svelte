<!--
  @file src/lib/sys/debug/vpb/components/VPBToast.svelte
  @name VPBToast.svelte
  @module @devpulse/sys/debug/vpb/components/VPBToast
  @layer lib

  @description
  Toast wrapper for VPB scope - uses svelte-sonner.
  Ensures toasts are styled with VPB tokens and positioned correctly within the VPB layer.

  @dependencies
  - svelte-sonner
  - tokens.css (global)

  @since 1.0.0
-->
<script lang="ts">
  import { Toaster } from "svelte-sonner";
</script>

<Toaster
  position="bottom-right"
  theme="dark"
  richColors
  expand
  toastOptions={{
    style: `
      background: var(--dp-vpb-panel-bg);
      border: 1px solid var(--dp-vpb-panel-border);
      color: var(--dp-vpb-text-primary);
      backdrop-filter: var(--dp-vpb-blur);
      -webkit-backdrop-filter: var(--dp-vpb-blur);
      font-family: var(--dp-font-sans, system-ui, sans-serif);
      font-size: 13px;
      z-index: var(--dp-vpb-z-tooltip);
    `,
  }}
  offset="80px"
/>

<style>
  :global(.vpb-toast) {
    font-family: var(--dp-font-sans, system-ui, sans-serif);
    font-size: 13px;
  }
</style>
