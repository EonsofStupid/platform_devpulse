<!--
  @file DialogPortal.svelte
  @layer primitives
  @kind dialog
  @slot portal

  Dialog portal — renders children outside the DOM hierarchy.

  ColdLight OWNS:
  - data-kind="dialog", data-slot="portal"

  Adapter (via melt action):
  - Portal rendering (moves content to document.body or target)

  Note: MeltUI element name is `portalled`, ColdLight slot is `portal`.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { melt } from "$lib/design/taxonomy/.generated/imports.gen";
  import { getDialogContext } from "./context.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  interface Props {
    /** Portal content (Overlay + Content) */
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
    elements: { portalled },
  } = dialog;
</script>

<div use:melt={$portalled} class={className} data-kind="dialog" data-slot="portal">
  {#if children}
    {@render children()}
  {/if}
</div>
