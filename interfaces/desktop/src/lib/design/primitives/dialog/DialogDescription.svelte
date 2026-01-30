<!--
  @file DialogDescription.svelte
  @layer primitives
  @kind dialog
  @slot description

  Dialog description — paragraph element linked via aria-describedby.

  ColdLight OWNS:
  - data-kind="dialog", data-slot="description"

  Adapter (via melt action):
  - id (linked to content's aria-describedby)
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { melt } from "$lib/design/taxonomy/.generated/imports.gen";
  import { getDialogContext } from "./context.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  interface Props {
    /** Description content */
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
    elements: { description },
  } = dialog;
</script>

<p use:melt={$description} class={className} data-kind="dialog" data-slot="description">
  {#if children}
    {@render children()}
  {/if}
</p>
