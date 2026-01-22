<!--
  @file primitives/alert-dialog/Content.svelte
  @layer primitives

  AlertDialog content - main modal container for confirmations.

  ARIA (handled by Bits UI):
  - role="alertdialog"  <-- Different from Dialog!
  - aria-modal="true"
  - aria-labelledby (linked to Title)
  - aria-describedby (linked to Description)

  Features (handled by Bits UI):
  - Focus trapping
  - Escape key dismissal (configurable)
  - Click outside IGNORED by default  <-- Different from Dialog!
  - Scroll lock

  Data Attributes:
  - data-kind="alert-dialog"
  - data-slot="content"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { AlertDialog } from "bits-ui";
  import type { AlertDialogContentProps, AlertDialogState } from "./types.js";
  import { stripStyleProp, cn } from "../types.js";

  let {
    children,
    closeOnEscape = true,
    interactOutsideBehavior = "ignore",  // DEFAULT: ignore (unlike Dialog)
    trapFocus = true,
    preventScroll = true,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: AlertDialogContentProps = $props();

  stripStyleProp(rest, "AlertDialog.Content");

  function handleEscapeKeydown(e: KeyboardEvent) {
    if (!closeOnEscape) {
      e.preventDefault();
    }
  }
</script>

<AlertDialog.Content
  onEscapeKeydown={handleEscapeKeydown}
  {interactOutsideBehavior}
  {trapFocus}
  {preventScroll}
  {...rest}
>
  {#snippet child({ props, open })}
    {@const dataState: AlertDialogState = open ? "open" : "closed"}
    <div
      {...props}
      class={cn(props.class, className)}
      data-kind="alert-dialog"
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
</AlertDialog.Content>
