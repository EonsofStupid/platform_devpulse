<!--
  @file primitives/dialog/Trigger.svelte
  @layer primitives

  Dialog trigger - button that opens the dialog.

  ARIA (handled by Bits UI):
  - aria-haspopup="dialog"
  - aria-expanded="true/false"

  Data Attributes:
  - data-kind="dialog"
  - data-slot="trigger"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { DialogTriggerProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: DialogTriggerProps = $props();

  stripStyleProp(rest, "Dialog.Trigger");
</script>

<Dialog.Trigger
  class={className}
  data-kind="dialog"
  data-slot="trigger"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</Dialog.Trigger>
