<!--
  @file primitives/dialog/Overlay.svelte
  @layer primitives

  Dialog overlay - backdrop behind dialog content.

  Data Attributes:
  - data-primitive="dialog"
  - data-slot="overlay"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { DialogOverlayProps, DialogState } from "./types.js";
  import { stripStyleProp, cn } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: DialogOverlayProps = $props();

  stripStyleProp(rest, "Dialog.Overlay");
</script>

<Dialog.Overlay {...rest}>
  {#snippet child({ props, open })}
    {@const dataState: DialogState = open ? "open" : "closed"}
    <div
      {...props}
      class={cn(props.class, className)}
      data-primitive="dialog"
      data-slot="overlay"
      data-state={dataState}
      data-id={dataId}
    >
      {#if children}
        {@render children({ open })}
      {/if}
    </div>
  {/snippet}
</Dialog.Overlay>
