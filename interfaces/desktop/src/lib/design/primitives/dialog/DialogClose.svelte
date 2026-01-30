<!--
  @file DialogClose.svelte
  @layer primitives
  @kind dialog
  @slot close

  Dialog close — button that closes the dialog.

  ColdLight OWNS:
  - data-kind="dialog", data-slot="close"

  Adapter (via melt action):
  - Click handler to close dialog
  - Keyboard: Enter/Space to close
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
  }

  let { children, class: className = "" }: Props = $props();

  // ===========================================================================
  // CONTEXT — get builder from Dialog root
  // ===========================================================================

  const dialog = getDialogContext();
  const {
    elements: { close },
  } = dialog;
</script>

<button use:melt={$close} class={className} data-kind="dialog" data-slot="close">
  {#if children}
    {@render children()}
  {/if}
</button>
