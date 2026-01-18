<!--
  @file src/lib/sys/debug/vpb/components/VPBToast.svelte
  @name VPBToast.svelte
  @module @devpulse/sys/debug/vpb/components/VPBToast
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
  VPBToast.svelte
  Toast wrapper for VPB scope - uses svelte-sonner
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
      background: var(--vpb-panel-bg);
      border: 1px solid var(--vpb-panel-border);
      color: var(--vpb-text-primary);
      backdrop-filter: var(--vpb-blur);
      -webkit-backdrop-filter: var(--vpb-blur);
      font-family: var(--dp-font-sans, system-ui, sans-serif);
      font-size: 13px;
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
