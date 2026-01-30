<!--
  @file primitives/select/Root.svelte
  @layer primitives

  Select Root - ColdLight ARIA Ownership Implementation.

  ColdLight is the SINGLE SOURCE OF TRUTH for:
  - ALL IDs (generated with useId(), shared via context)
  - ALL ARIA state (open, highlighted, selected)
  - ALL data attributes

  meltui provides ONLY:
  - Keyboard navigation handlers
  - Click handlers
  - Positioning logic
  - Portal rendering

  WAI-ARIA Combobox Pattern:
  @see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
  @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/

  Data Attributes:
  - data-kind="select"
  - data-slot="root"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { Select, useId } from "meltui";
  import { setContext } from "svelte";
  import type {
    SelectRootProps,
    SelectState,
    SelectContext,
  } from "./types.js";
  import { SELECT_CONTEXT_KEY } from "./types.js";

  let {
    open = $bindable(false),
    onOpenChange,
    value = $bindable<string | string[] | undefined>(undefined),
    onValueChange,
    type = "single",
    items,
    disabled = false,
    loop = false,
    name,
    required = false,
    children,
    "data-id": dataId,
  }: SelectRootProps = $props();

  // ========================================
  // COLDLIGHT OWNS ALL IDs
  // ========================================
  const triggerId = useId();
  const contentId = useId();

  // ========================================
  // COLDLIGHT OWNS HIGHLIGHTED STATE
  // ========================================
  // ColdLight tracks the highlighted item value internally.
  // This is used to set aria-activedescendant on the trigger
  // and data-highlighted on items.
  let highlightedValue = $state<string | null>(null);

  // Item ID registry - maps item values to ColdLight-generated IDs
  const itemIdMap = new Map<string, string>();

  /**
   * Register an item and return its ColdLight-generated ID.
   * Called by Item.svelte on mount.
   */
  function registerItem(itemValue: string): string {
    if (!itemIdMap.has(itemValue)) {
      itemIdMap.set(itemValue, useId());
    }
    return itemIdMap.get(itemValue)!;
  }

  /**
   * Get the ColdLight-generated ID for an item by its value.
   */
  function getItemId(itemValue: string): string | undefined {
    return itemIdMap.get(itemValue);
  }

  // ========================================
  // COLDLIGHT CONTEXT (SINGLE SOURCE OF TRUTH)
  // ========================================
  const selectContext: SelectContext = {
    // Static IDs
    triggerId,
    contentId,

    // Reactive state getters
    open: () => open,
    highlightedValue: () => highlightedValue,
    setHighlightedValue: (val: string | null) => {
      highlightedValue = val;
    },
    selectedValue: () => value,
    type: () => type,
    disabled: () => disabled,

    // Item registration
    registerItem,
    getItemId,
  };

  setContext<SelectContext>(SELECT_CONTEXT_KEY, selectContext);

  // ========================================
  // DERIVED STATE
  // ========================================
  const dataState: SelectState = $derived(open ? "open" : "closed");

  // ========================================
  // SYNC HIGHLIGHTED STATE FROM MELTUI
  // ========================================
  // meltui manages keyboard navigation internally.
  // We listen for highlight changes via the highlightedItem callback
  // and sync to ColdLight's state.
  function handleHighlight(item: { value: string } | undefined) {
    highlightedValue = item?.value ?? null;
  }
</script>

<div
  data-kind="select"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  <Select.Root
    bind:open
    {onOpenChange}
    bind:value
    {onValueChange}
    {type}
    {items}
    {disabled}
    {loop}
    {name}
    {required}
    onHighlight={handleHighlight}
  >
    {#if children}
      {@render children()}
    {/if}
  </Select.Root>
</div>
