<!--
  @file primitives/alert-dialog/Trigger.svelte
  @layer primitives

  AlertDialog trigger - button that opens the alert dialog.

  ARIA (handled by Bits UI):
  - aria-haspopup="dialog"
  - aria-expanded="true/false"

  Data Attributes:
  - data-kind="alert-dialog"
  - data-slot="trigger"
-->
<script lang="ts">
  import { AlertDialog } from "meltui";
  import type { AlertDialogTriggerProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: AlertDialogTriggerProps = $props();

  stripStyleProp(rest, "AlertDialog.Trigger");
</script>

<AlertDialog.Trigger
  class={className}
  data-kind="alert-dialog"
  data-slot="trigger"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</AlertDialog.Trigger>
