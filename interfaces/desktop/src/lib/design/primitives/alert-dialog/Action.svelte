<!--
  @file primitives/alert-dialog/Action.svelte
  @layer primitives

  AlertDialog action - button that does NOT auto-close the dialog.
  Used for destructive/confirming actions (Delete, Confirm, etc.)

  The consumer is responsible for closing the dialog after the action:
  <AlertDialog.Action onclick={() => { deleteItem(); open = false; }}>

  Data Attributes:
  - data-kind="alert-dialog"
  - data-slot="action"
-->
<script lang="ts">
  import { AlertDialog } from "bits-ui";
  import type { AlertDialogActionProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: AlertDialogActionProps = $props();

  stripStyleProp(rest, "AlertDialog.Action");
</script>

<AlertDialog.Action
  class={className}
  data-kind="alert-dialog"
  data-slot="action"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</AlertDialog.Action>
