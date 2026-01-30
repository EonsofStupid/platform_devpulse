<!--
  @file DialogTitle.svelte
  @layer primitives
  @kind dialog
  @slot title

  Dialog title — heading element linked via aria-labelledby.

  ColdLight OWNS:
  - data-kind="dialog", data-slot="title"

  Adapter (via melt action):
  - id (linked to content's aria-labelledby)
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { melt } from "$lib/design/taxonomy/.generated/imports.gen";
  import { getDialogContext } from "./context.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  interface Props {
    /** Title content */
    children?: Snippet;
    /** CSS class */
    class?: string;
    /** Heading level (default: 2) */
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  }

  let { children, class: className = "", level = 2 }: Props = $props();

  // ===========================================================================
  // CONTEXT — get builder from Dialog root
  // ===========================================================================

  const dialog = getDialogContext();
  const {
    elements: { title },
  } = dialog;
</script>

<!--
  MeltUI's title element provides the id for aria-labelledby linking.
  We render the appropriate heading level via conditional blocks.
-->
{#if level === 1}
  <h1 use:melt={$title} class={className} data-kind="dialog" data-slot="title">
    {#if children}{@render children()}{/if}
  </h1>
{:else if level === 3}
  <h3 use:melt={$title} class={className} data-kind="dialog" data-slot="title">
    {#if children}{@render children()}{/if}
  </h3>
{:else if level === 4}
  <h4 use:melt={$title} class={className} data-kind="dialog" data-slot="title">
    {#if children}{@render children()}{/if}
  </h4>
{:else if level === 5}
  <h5 use:melt={$title} class={className} data-kind="dialog" data-slot="title">
    {#if children}{@render children()}{/if}
  </h5>
{:else if level === 6}
  <h6 use:melt={$title} class={className} data-kind="dialog" data-slot="title">
    {#if children}{@render children()}{/if}
  </h6>
{:else}
  <h2 use:melt={$title} class={className} data-kind="dialog" data-slot="title">
    {#if children}{@render children()}{/if}
  </h2>
{/if}
