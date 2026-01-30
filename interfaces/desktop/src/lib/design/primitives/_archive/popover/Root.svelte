<!--
  @file primitives/popover/Root.svelte
  @layer primitives

  Popover root - manages open/closed state.

  Data Attributes:
  - data-kind="popover"
  - data-slot="root"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { Popover } from "meltui";
  import type { PopoverRootProps, PopoverState } from "./types.js";

  let {
    open = $bindable(false),
    onOpenChange,
    children,
    "data-id": dataId,
  }: PopoverRootProps = $props();

  const dataState: PopoverState = $derived(open ? "open" : "closed");
</script>

<div
  data-kind="popover"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  <Popover.Root bind:open {onOpenChange}>
    {#if children}
      {@render children()}
    {/if}
  </Popover.Root>
</div>
