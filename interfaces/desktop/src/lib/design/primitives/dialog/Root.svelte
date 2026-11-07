<!--
  @file primitives/dialog/Root.svelte
  @layer primitives

  Dialog root - manages open/closed state.

  Data Attributes:
  - data-kind="dialog"
  - data-slot="root"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { DialogRootProps, DialogState } from "./types.js";

  let {
    open = $bindable(false),
    onOpenChange,
    children,
    "data-id": dataId,
  }: DialogRootProps = $props();

  const dataState: DialogState = $derived(open ? "open" : "closed");
</script>

<div
  data-kind="dialog"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  <Dialog.Root bind:open {onOpenChange}>
    {#if children}
      {@render children()}
    {/if}
  </Dialog.Root>
</div>
