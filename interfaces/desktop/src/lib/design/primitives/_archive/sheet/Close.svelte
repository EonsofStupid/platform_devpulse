<!--
  @file primitives/sheet/Close.svelte
  @layer primitives

  Sheet close - button that closes the sheet.

  Data Attributes:
  - data-kind="sheet"
  - data-slot="close"
-->
<script lang="ts">
  import { Dialog } from "meltui";
  import type { SheetCloseProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: SheetCloseProps = $props();

  stripStyleProp(rest, "Sheet.Close");
</script>

<Dialog.Close
  class={className}
  data-kind="sheet"
  data-slot="close"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Dialog.Close>
