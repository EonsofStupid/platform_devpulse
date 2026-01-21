<!--
  @file primitives/sheet/Root.svelte
  @layer primitives

  Sheet root - manages open/closed state.

  Data Attributes:
  - data-primitive="sheet"
  - data-slot="root"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { SheetRootProps, SheetState } from "./types.js";

  let {
    open = $bindable(false),
    onOpenChange,
    children,
    "data-id": dataId,
  }: SheetRootProps = $props();

  const dataState: SheetState = $derived(open ? "open" : "closed");
</script>

<div
  data-primitive="sheet"
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
