<!--
  @file primitives/alert-dialog/Portal.svelte
  @layer primitives

  AlertDialog portal - renders children outside DOM hierarchy.

  Data Attributes:
  - data-kind="alert-dialog"
  - data-slot="portal"
-->
<script lang="ts">
  import { AlertDialog } from "bits-ui";
  import type { AlertDialogPortalProps } from "./types.js";

  let {
    to,
    disabled = false,
    children,
    "data-id": dataId,
  }: AlertDialogPortalProps = $props();
</script>

<AlertDialog.Portal {to} {disabled}>
  <div
    data-kind="alert-dialog"
    data-slot="portal"
    data-id={dataId}
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
</AlertDialog.Portal>
