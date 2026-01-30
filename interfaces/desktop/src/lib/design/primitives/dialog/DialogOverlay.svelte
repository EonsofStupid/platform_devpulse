<!--
  @file DialogOverlay.svelte
  @layer primitives
  @kind dialog
  @slot overlay

  Dialog overlay — backdrop behind the dialog content.

  ColdLight OWNS:
  - data-kind="dialog", data-slot="overlay", data-state

  Adapter (via melt action):
  - Click handler for close-on-outside-click
  - Visibility management
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { melt } from "$lib/design/taxonomy/.generated/imports.gen";
  import { getDialogContext } from "./context.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  interface Props {
    /** Optional overlay content */
    children?: Snippet;
    /** CSS class */
    class?: string;
  }

  let { children, class: className = "" }: Props = $props();

  // ===========================================================================
  // CONTEXT — get builder from Dialog root
  // ===========================================================================

  const dialog = getDialogContext();
  const {
    elements: { overlay },
    states: { open },
  } = dialog;
</script>

<div
  use:melt={$overlay}
  class={className}
  data-kind="dialog"
  data-slot="overlay"
  data-state={$open ? "visible" : "hidden"}
>
  {#if children}
    {@render children()}
  {/if}
</div>
