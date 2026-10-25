<!--
  @file primitives/popover/Overlay.svelte
  @layer primitives

  Popover overlay - optional backdrop behind popover content.
  Note: Popovers typically don't use overlays, but included for completeness.

  Data Attributes:
  - data-kind="popover"
  - data-slot="overlay"
  - data-state="open" | "closed"
-->
<script lang="ts">
import { Popover } from "meltui";
import { cn, stripStyleProp } from "../types.js";
import type { PopoverOverlayProps, PopoverState } from "./types.js";

let { children, class: className = "", "data-id": dataId, ...rest }: PopoverOverlayProps = $props();

stripStyleProp(rest, "Popover.Overlay");
</script>

<Popover.Overlay {...rest}>
  {#snippet child({ props, open })}
    {@const dataState: PopoverState = open ? "open" : "closed"}
    <div
      {...props}
      class={cn(props.class, className)}
      data-kind="popover"
      data-slot="overlay"
      data-state={dataState}
      data-id={dataId}
    >
      {#if children}
        {@render children({ open })}
      {/if}
    </div>
  {/snippet}
</Popover.Overlay>
