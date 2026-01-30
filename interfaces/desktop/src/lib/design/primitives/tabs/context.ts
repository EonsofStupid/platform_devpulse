/**
 * @file Tabs Context
 * @layer primitives
 * @kind tabs
 *
 * Svelte context for sharing tabs state between compound components.
 * The root Tabs component creates the builder instance and shares
 * it via context. Child components (TabsList, TabsTrigger, TabsContent)
 * access it to render their slots.
 *
 * Imports from ColdLight cloak — zero adapter awareness.
 */

import { getContext, setContext } from "svelte";
import type { TabsInstance } from "$lib/design/taxonomy/.generated/imports.gen";

// =============================================================================
// CONTEXT KEY
// =============================================================================

const TABS_CTX = Symbol("tabs");

// =============================================================================
// TYPES
// =============================================================================

/**
 * Tabs context type - the builder instance from the adapter layer.
 * Opaque to consumers - they don't need to know it's MeltUI underneath.
 */
export type TabsContext = TabsInstance;

// =============================================================================
// CONTEXT API
// =============================================================================

/**
 * Set tabs context (called by Tabs root).
 */
export function setTabsContext(ctx: TabsContext): void {
  setContext(TABS_CTX, ctx);
}

/**
 * Get tabs context (called by child components).
 * Throws if called outside a Tabs component tree.
 */
export function getTabsContext(): TabsContext {
  const ctx = getContext<TabsContext>(TABS_CTX);
  if (!ctx) {
    throw new Error("Tabs components must be used within a Tabs root");
  }
  return ctx;
}
