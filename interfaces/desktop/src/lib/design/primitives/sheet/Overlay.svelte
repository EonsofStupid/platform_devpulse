<!--
  @file primitives/sheet/Overlay.svelte
  @layer primitives

  Sheet overlay - backdrop behind sheet content.

  Data Attributes:
  - data-primitive="sheet"
  - data-slot="overlay"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { SheetOverlayProps, SheetState } from "./types.js";
  import { stripStyleProp, cn } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: SheetOverlayProps = $props();

  stripStyleProp(rest, "Sheet.Overlay");
</script>

<Dialog.Overlay {...rest}>
  {#snippet child({ props, open })}
    {@const dataState: SheetState = open ? "open" : "closed"}
    <div
      {...props}
      class={cn(props.class, className)}
      data-primitive="sheet"
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
