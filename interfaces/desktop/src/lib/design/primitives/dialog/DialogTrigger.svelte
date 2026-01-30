<!--
  @file DialogTrigger.svelte
  @layer primitives
  @kind dialog
  @slot trigger

  Dialog trigger — button that opens the dialog.

  ColdLight OWNS:
  - data-kind="dialog", data-slot="trigger"

  Adapter (via melt action):
  - aria-haspopup="dialog"
  - aria-expanded (synced to open state)
  - aria-controls (linked to content id)
  - Click handler to toggle open
  - Keyboard: Enter/Space to toggle
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { melt } from "$lib/design/taxonomy/.generated/imports.gen";
  import { getDialogContext } from "./context.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  interface Props {
    /** Button content */
    children?: Snippet;
    /** CSS class */
    class?: string;
    /** Disabled state */
    disabled?: boolean;
  }

  let { children, class: className = "", disabled = false }: Props = $props();

  // ===========================================================================
  // CONTEXT — get builder from Dialog root
  // ===========================================================================

  const dialog = getDialogContext();
  const {
    elements: { trigger },
  } = dialog;
</script>

<button
  use:melt={$trigger}
  class={className}
  {disabled}
  data-kind="dialog"
  data-slot="trigger"
>
  {#if children}
    {@render children()}
  {/if}
</button>
