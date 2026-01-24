<!--
  @file primitives/alert-dialog/Root.svelte
  @layer primitives

  AlertDialog root - manages open/closed state for confirmation dialogs.

  Data Attributes:
  - data-kind="alert-dialog"
  - data-slot="root"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { AlertDialog } from "bits-ui";
  import type { AlertDialogRootProps, AlertDialogState } from "./types.js";

  let {
    open = $bindable(false),
    onOpenChange,
    children,
    "data-id": dataId,
  }: AlertDialogRootProps = $props();

  const dataState: AlertDialogState = $derived(open ? "open" : "closed");
</script>

<div
  data-kind="alert-dialog"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  <AlertDialog.Root bind:open {onOpenChange}>
    {#if children}
      {@render children()}
    {/if}
  </AlertDialog.Root>
</div>
