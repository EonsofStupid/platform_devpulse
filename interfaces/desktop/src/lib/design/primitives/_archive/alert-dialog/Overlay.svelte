<!--
  @file primitives/alert-dialog/Overlay.svelte
  @layer primitives

  AlertDialog overlay - backdrop behind alert dialog content.

  Data Attributes:
  - data-kind="alert-dialog"
  - data-slot="overlay"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { AlertDialog } from "bits-ui";
  import type { AlertDialogOverlayProps, AlertDialogState } from "./types.js";
  import { stripStyleProp, cn } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: AlertDialogOverlayProps = $props();

  stripStyleProp(rest, "AlertDialog.Overlay");
</script>

<AlertDialog.Overlay {...rest}>
  {#snippet child({ props, open })}
    {@const dataState: AlertDialogState = open ? "open" : "closed"}
    <div
      {...props}
      class={cn(props.class, className)}
      data-kind="alert-dialog"
      data-slot="overlay"
      data-state={dataState}
      data-id={dataId}
    >
      {#if children}
        {@render children({ open })}
      {/if}
    </div>
  {/snippet}
</AlertDialog.Overlay>
