<!--
  @file primitives/popover/Close.svelte
  @layer primitives

  Popover close - button that closes the popover.

  Data Attributes:
  - data-kind="popover"
  - data-slot="close"
-->
<script lang="ts">
import { Popover } from "meltui";
import { stripStyleProp } from "../types.js";
import type { PopoverCloseProps } from "./types.js";

let { children, class: className = "", "data-id": dataId, ...rest }: PopoverCloseProps = $props();

stripStyleProp(rest, "Popover.Close");
</script>

<Popover.Close
  class={className}
  data-kind="popover"
  data-slot="close"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Popover.Close>
