<!--
  @file primitives/alert-dialog/Cancel.svelte
  @layer primitives

  AlertDialog cancel - button that auto-closes the dialog.
  Used for aborting the action (Cancel, Nevermind, etc.)

  Data Attributes:
  - data-kind="alert-dialog"
  - data-slot="cancel"
-->
<script lang="ts">
  import { AlertDialog } from "bits-ui";
  import type { AlertDialogCancelProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: AlertDialogCancelProps = $props();

  stripStyleProp(rest, "AlertDialog.Cancel");
</script>

<AlertDialog.Cancel
  class={className}
  data-kind="alert-dialog"
  data-slot="cancel"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</AlertDialog.Cancel>
