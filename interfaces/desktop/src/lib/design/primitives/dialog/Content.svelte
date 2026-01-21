<!--
  @file primitives/dialog/Content.svelte
  @layer primitives

  Dialog content - main modal container.

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
  - data-primitive="dialog"
  - data-slot="content"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { Dialog } from "bits-ui";
  import type { DialogContentProps, DialogState } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    children,
    closeOnEscape = true,
    closeOnOutsideClick = true,
    trapFocus = true,
    preventScroll = true,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: DialogContentProps = $props();

  stripStyleProp(rest, "Dialog.Content");

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
  class={className}
  onEscapeKeydown={handleEscapeKeydown}
  onInteractOutside={handleInteractOutside}
  {trapFocus}
  {preventScroll}
  data-primitive="dialog"
  data-slot="content"
  data-id={dataId}
  {...rest}
>
  {#snippet child({ open })}
    {@const dataState: DialogState = open ? "open" : "closed"}
    <div data-state={dataState}>
      {#if typeof children === "function" && children.length > 0}
        {@render children({ open })}
      {:else if children}
        {@render children()}
      {/if}
    </div>
  {/snippet}
</Dialog.Content>
