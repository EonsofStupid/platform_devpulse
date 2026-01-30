<!--
  @file DialogContent.svelte
  @layer primitives
  @kind dialog
  @slot content

  Dialog content — the main modal panel.

  ColdLight OWNS:
  - data-kind="dialog", data-slot="content", data-state

  Adapter (via melt action):
  - role="dialog"
  - aria-modal="true"
  - aria-labelledby (linked to title id)
  - aria-describedby (linked to description id)
  - id (for aria-controls on trigger)
  - Focus trapping
  - Escape key dismissal
  - Scroll lock
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { melt } from "$lib/design/taxonomy/.generated/imports.gen";
  import { getDialogContext } from "./context.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  interface Props {
    /** Dialog content */
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
    elements: { content },
    states: { open },
  } = dialog;
</script>

<div
  use:melt={$content}
  class={className}
  data-kind="dialog"
  data-slot="content"
  data-state={$open ? "open" : "closed"}
>
  {#if children}
    {@render children()}
  {/if}
</div>
