<!--
  @file primitives/sheet/Content.svelte
  @layer primitives

  Sheet content - main slide-in panel.

  ARIA (handled by Bits UI):
  - role="dialog"
  - aria-modal="true"
  - aria-labelledby (linked to Title)
  - aria-describedby (linked to Description)

  Features (handled by Bits UI):
  - Focus trapping
  - Escape key dismissal
  - Click outside dismissal
  - Scroll lock

  Data Attributes:
  - data-kind="sheet"
  - data-slot="content"
  - data-state="open" | "closed"
  - data-side="left" | "right" | "top" | "bottom"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { SheetContentProps, SheetState } from "./types.js";
  import { stripStyleProp, cn } from "../types.js";

  let {
    side = "right",
    children,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    trapFocus = true,
    preventScroll = true,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: SheetContentProps = $props();

  stripStyleProp(rest, "Sheet.Content");

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

<Dialog.Content
  onEscapeKeydown={handleEscapeKeydown}
  onInteractOutside={handleInteractOutside}
  {trapFocus}
  {preventScroll}
  {...rest}
>
  {#snippet child({ props, open })}
    {@const dataState: SheetState = open ? "open" : "closed"}
    <div
      {...props}
      class={cn(props.class, className)}
      data-kind="sheet"
      data-slot="content"
      data-state={dataState}
      data-side={side}
      data-id={dataId}
    >
      {#if typeof children === "function" && children.length > 0}
        {@render children({ open })}
      {:else if children}
        {@render children()}
      {/if}
    </div>
  {/snippet}
</Dialog.Content>
