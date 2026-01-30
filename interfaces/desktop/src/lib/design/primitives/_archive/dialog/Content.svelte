<!--
  @file primitives/dialog/Content.svelte
  @layer primitives

  Dialog content - main modal container.

  ColdLight OWNS (set EXPLICITLY):
  - id={contentId}
  - role="dialog"
  - aria-modal="true"
  - aria-labelledby={titleId}
  - aria-describedby={descriptionId}
  - tabindex={-1}

  meltui provides ONLY behavior:
  - Focus trapping
  - Escape key dismissal
  - Click outside dismissal
  - Scroll lock

  Data Attributes:
  - data-kind="dialog"
  - data-slot="content"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { Dialog } from "meltui";
  import { getContext } from "svelte";
  import type { DialogContentProps, DialogState, DialogContext } from "./types.js";
  import { DIALOG_CONTEXT_KEY } from "./types.js";
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

  // ============================================
  // COLDLIGHT GETS IDs FROM CONTEXT
  // ============================================
  const ctx = getContext<DialogContext>(DIALOG_CONTEXT_KEY);
  const { contentId, titleId, descriptionId } = ctx;

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

<!--
  meltui Dialog.Content provides ONLY behavior:
  - Focus trapping (trapFocus)
  - Escape handling (onEscapeKeydown)
  - Click outside (onInteractOutside)
  - Scroll lock (preventScroll)
  - Ref attachment (for focus management)

  We spread {...props} FIRST for the ref attachment (behavior),
  then OVERRIDE with ColdLight's ARIA attributes (ownership).
  ColdLight's values come LAST, so they take precedence.
-->
<Dialog.Content
  onEscapeKeydown={handleEscapeKeydown}
  onInteractOutside={handleInteractOutside}
  {trapFocus}
  {preventScroll}
>
  {#snippet child({ props, open }: { props: Record<string, unknown>; open: boolean })}
    {@const dataState: DialogState = open ? "open" : "closed"}
    <!--
      Spread meltui props FIRST (for ref attachment/focus),
      then ColdLight OVERRIDES all ARIA attributes.
      ColdLight is SSOT - our values come last and win.
    -->
    <div
      {...props}
      id={contentId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabindex={-1}
      class={className}
      data-kind="dialog"
      data-slot="content"
      data-state={dataState}
      data-id={dataId}
      {...rest}
    >
      {#if children}
        {@render children({ open })}
      {/if}
    </div>
  {/snippet}
</Dialog.Content>
