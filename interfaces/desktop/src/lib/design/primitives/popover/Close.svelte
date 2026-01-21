<!--
  @file primitives/popover/Close.svelte
  @layer primitives

  Popover close - button that closes the popover.

  Data Attributes:
  - data-primitive="popover"
  - data-slot="close"
-->
<script lang="ts">
  import { Popover } from "bits-ui";
  import type { PopoverCloseProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: PopoverCloseProps = $props();

  stripStyleProp(rest, "Popover.Close");
</script>

<Popover.Close
  class={className}
  data-primitive="popover"
  data-slot="close"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Popover.Close>
