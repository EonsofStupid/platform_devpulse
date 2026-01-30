<!--
  @file TabsContent.svelte
  @layer primitives
  @kind tabs
  @slot content

  Tabs content — panel associated with a tab trigger.

  ColdLight OWNS:
  - data-kind="tabs", data-slot="content", data-state

  Adapter (via melt action):
  - role="tabpanel"
  - aria-labelledby (linked to trigger)
  - tabindex="0"
  - id (for trigger aria-controls linking)

  CRITICAL: MeltUI's content is a store. $content is a function.
  Use $content(value) in the template to get element attributes.
-->
<script lang="ts">
  import { melt } from "$lib/design/taxonomy/.generated/imports.gen";
  import { getTabsContext } from "./context.js";
  import type { TabsContentProps } from "./types.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  let {
    value,
    class: className = "",
    children,
  }: TabsContentProps = $props();

  // ===========================================================================
  // CONTEXT — get builder from Tabs root
  // ===========================================================================

  const tabs = getTabsContext();
  const {
    elements: { content },
    states: { value: tabValue },
  } = tabs;
</script>

<div
  use:melt={$content(value)}
  class={className}
  data-kind="tabs"
  data-slot="content"
  data-state={$tabValue === value ? "visible" : "hidden"}
>
  {#if children}
    {@render children()}
  {/if}
</div>
