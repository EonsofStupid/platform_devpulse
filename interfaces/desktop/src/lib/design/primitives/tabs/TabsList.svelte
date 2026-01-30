<!--
  @file TabsList.svelte
  @layer primitives
  @kind tabs
  @slot list

  Tabs list — container for tab triggers.

  ColdLight OWNS:
  - data-kind="tabs", data-slot="list"

  Adapter (via melt action):
  - role="tablist"
  - aria-orientation
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import { melt } from "$lib/design/taxonomy/.generated/imports.gen";
  import { getTabsContext } from "./context.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  interface Props {
    /** Tab triggers */
    children?: Snippet;
    /** CSS class */
    class?: string;
  }

  let { children, class: className = "" }: Props = $props();

  // ===========================================================================
  // CONTEXT — get builder from Tabs root
  // ===========================================================================

  const tabs = getTabsContext();
  const {
    elements: { list },
  } = tabs;
</script>

<div use:melt={$list} class={className} data-kind="tabs" data-slot="list">
  {#if children}
    {@render children()}
  {/if}
</div>
