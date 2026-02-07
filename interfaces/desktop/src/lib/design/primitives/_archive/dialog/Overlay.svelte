<!--
  @file primitives/dialog/Overlay.svelte
  @layer primitives

  Dialog overlay - backdrop behind dialog content.

  ColdLight OWNS:
  - Native div element
  - All data attributes

  meltui provides ONLY behavior:
  - Presence management (mount/unmount)

  Data Attributes:
  - data-kind="dialog"
  - data-slot="overlay"
  - data-state="open" | "closed"
-->
<script lang="ts">
import { Dialog } from "meltui";
import type { DialogOverlayProps, DialogState } from "./types.js";

let { children, class: className = "", "data-id": dataId }: DialogOverlayProps = $props();
</script>

<!--
  meltui Dialog.Overlay provides ONLY behavior:
  - Presence management (mount/unmount animations)
  - Ref attachment

  Spread {...props} FIRST for ref attachment (behavior),
  then OVERRIDE with ColdLight's attributes (ownership).
-->
<Dialog.Overlay>
  {#snippet child({ props, open }: { props: Record<string, unknown>; open: boolean })}
    {@const dataState: DialogState = open ? "open" : "closed"}
    <div
      {...props}
      class={className}
      data-kind="dialog"
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
