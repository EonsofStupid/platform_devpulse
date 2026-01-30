<!--
  @file Tabs.svelte
  @layer primitives
  @kind tabs
  @slot root

  Tabs root — creates builder instance and shares via context.

  ColdLight OWNS:
  - data-kind="tabs", data-slot="root"
  - Svelte context sharing (child slots access builder instance)

  Adapter (via cloak):
  - State management (selected tab coordination)
  - Builder instance creation

  @example
  ```svelte
  <Tabs defaultValue="tab1">
    <TabsList>
      <TabsTrigger value="tab1">Tab 1</TabsTrigger>
      <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">Content 1</TabsContent>
    <TabsContent value="tab2">Content 2</TabsContent>
  </Tabs>
  ```
-->
<script lang="ts">
  import { createTabs, melt } from "$lib/design/taxonomy/.generated/imports.gen";
  import { setTabsContext } from "./context.js";
  import type { TabsProps } from "./types.js";

  // ===========================================================================
  // PROPS
  // ===========================================================================

  let {
    defaultValue,
    value,
    onValueChange,
    orientation = "horizontal",
    activationMode = "automatic",
    loop = true,
    class: className = "",
    children,
  }: TabsProps = $props();

  // ===========================================================================
  // TABS FACTORY (via ColdLight cloak — adapter is invisible)
  // ===========================================================================

  const tabs = createTabs({
    defaultValue: value ?? defaultValue,
  });

  const {
    elements: { root },
    states: { value: tabValue },
  } = tabs;

  // ===========================================================================
  // REACTIVE OPTION SYNC
  // ===========================================================================

  $effect(() => {
    tabs.options.orientation.set(orientation);
  });

  $effect(() => {
    tabs.options.activateOnFocus.set(activationMode === "automatic");
  });

  $effect(() => {
    tabs.options.loop.set(loop);
  });

  // ===========================================================================
  // STATE SYNC (adapter → ColdLight)
  // ===========================================================================

  $effect(() => {
    const current = $tabValue;
    onValueChange?.(current);
  });

  // ===========================================================================
  // CONTEXT — child slot components access the builder instance
  // ===========================================================================

  setTabsContext(tabs);
</script>

<div use:melt={$root} class={className} data-kind="tabs" data-slot="root">
  {#if children}
    {@render children()}
  {/if}
</div>
