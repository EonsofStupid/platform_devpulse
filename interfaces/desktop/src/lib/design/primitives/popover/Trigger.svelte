<!--
  @file primitives/popover/Trigger.svelte
  @layer primitives

  Popover trigger - button that opens the popover.
  Supports hover-to-open with configurable delays.

  ARIA (handled by Bits UI):
  - aria-haspopup="dialog"
  - aria-expanded="true/false"
  - aria-controls (when open)

  Data Attributes:
  - data-kind="popover"
  - data-slot="trigger"
-->
<script lang="ts">
  import { Popover } from "bits-ui";
  import type { PopoverTriggerProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    openOnHover = false,
    openDelay = 700,
    closeDelay = 300,
    ...rest
  }: PopoverTriggerProps = $props();

  stripStyleProp(rest, "Popover.Trigger");
</script>

<Popover.Trigger
  class={className}
  data-kind="popover"
  data-slot="trigger"
  data-id={dataId}
  {openOnHover}
  {openDelay}
  {closeDelay}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Popover.Trigger>
