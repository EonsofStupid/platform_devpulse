<!--
  @file primitives/popover/Content.svelte
  @layer primitives

  Popover content - positioned floating container.

  Features (handled by Bits UI):
  - Floating UI positioning
  - Conditional focus trapping (only after interaction)
  - Escape key dismissal
  - Click outside dismissal

  Data Attributes:
  - data-kind="popover"
  - data-slot="content"
  - data-state="open" | "closed"
  - data-side (from Bits UI)
  - data-align (from Bits UI)
-->
<script lang="ts">
  import { Popover } from "meltui";
  import type { PopoverContentProps, PopoverState } from "./types.js";
  import { stripStyleProp, cn } from "../types.js";

  let {
    children,
    class: className = "",
    "data-id": dataId,
    // Positioning
    side = "bottom",
    sideOffset = 4,
    align = "center",
    alignOffset,
    arrowPadding,
    avoidCollisions = true,
    collisionPadding = 8,
    sticky,
    hideWhenDetached,
    // Behavior
    closeOnEscape = true,
    closeOnOutsideClick = true,
    trapFocus = true,
    preventScroll = false,
    customAnchor,
    ...rest
  }: PopoverContentProps = $props();

  stripStyleProp(rest, "Popover.Content");

  function handleEscapeKeydown(e: KeyboardEvent) {
    if (!closeOnEscape) {
      e.preventDefault();
    }
  }

  function handleInteractOutside(e: Event) {
    if (!closeOnOutsideClick) {
      e.preventDefault();
    }
  }
</script>

<Popover.Content
  {side}
  {sideOffset}
  {align}
  {alignOffset}
  {arrowPadding}
  {avoidCollisions}
  {collisionPadding}
  {sticky}
  {hideWhenDetached}
  {trapFocus}
  {preventScroll}
  {customAnchor}
  onEscapeKeydown={handleEscapeKeydown}
  onInteractOutside={handleInteractOutside}
  {...rest}
>
  {#snippet child({ props, open })}
    {@const dataState: PopoverState = open ? "open" : "closed"}
    <div
      {...props}
      class={cn(props.class, className)}
      data-kind="popover"
      data-slot="content"
      data-state={dataState}
      data-id={dataId}
    >
      {#if typeof children === "function" && children.length > 0}
        {@render children({ open })}
      {:else if children}
        {@render children()}
      {/if}
    </div>
  {/snippet}
</Popover.Content>
