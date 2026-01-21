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
  import { stripStyleProp } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: DialogOverlayProps = $props();

  stripStyleProp(rest, "Dialog.Overlay");
</script>

<Dialog.Overlay
  class={className}
  data-primitive="dialog"
  data-slot="overlay"
  data-id={dataId}
  {...rest}
>
  {#snippet child({ open })}
    {@const dataState: DialogState = open ? "open" : "closed"}
    <div data-state={dataState}>
      {#if children}
        {@render children({ open })}
      {/if}
    </div>
  {/snippet}
</Dialog.Overlay>
