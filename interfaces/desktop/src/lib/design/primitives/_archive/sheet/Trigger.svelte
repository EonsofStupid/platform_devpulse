<!--
  @file primitives/sheet/Trigger.svelte
  @layer primitives

  Sheet trigger - button that opens the sheet.

  ARIA (handled by Bits UI):
  - aria-haspopup="dialog"
  - aria-expanded="true/false"

  Data Attributes:
  - data-kind="sheet"
  - data-slot="trigger"
-->
<script lang="ts">
  import { Dialog } from "meltui";
  import type { SheetTriggerProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: SheetTriggerProps = $props();

  stripStyleProp(rest, "Sheet.Trigger");
</script>

<Dialog.Trigger
  class={className}
  data-kind="sheet"
  data-slot="trigger"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Dialog.Trigger>
