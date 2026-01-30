<!--
  @file TabsTrigger.svelte
  @layer primitives
  @kind tabs
  @slot trigger

  Tabs trigger — button that activates a tab panel.

  ColdLight OWNS:
  - data-kind="tabs", data-slot="trigger", data-state

  Adapter (via melt action):
  - role="tab"
  - aria-selected
  - aria-controls (linked to content panel)
  - tabindex
  - Click/keyboard handlers

  CRITICAL: MeltUI's trigger is a store. $trigger is a function.
  Use $trigger(value) in the template to get element attributes.
-->
<script lang="ts">
  import { melt } from "$lib/design/taxonomy/.generated/imports.gen";
  import { getTabsContext } from "./context.js";
  import type { TabsTriggerProps } from "./types.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  let {
    value,
    disabled = false,
    class: className = "",
    children,
  }: TabsTriggerProps = $props();

  // ===========================================================================
  // CONTEXT — get builder from Tabs root
  // ===========================================================================

  const tabs = getTabsContext();
  const {
    elements: { trigger },
    states: { value: tabValue },
  } = tabs;
</script>

<button
  use:melt={$trigger(value)}
  class={className}
  data-kind="tabs"
  data-slot="trigger"
  data-state={$tabValue === value ? "selected" : "idle"}
>
  {#if children}
    {@render children()}
  {/if}
</button>
