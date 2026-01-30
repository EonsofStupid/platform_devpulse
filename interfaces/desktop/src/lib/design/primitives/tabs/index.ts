/**
 * @file Tabs Primitive Barrel
 * @description Exports all Tabs components and related types/utilities.
 *
 * Usage:
 * ```ts
 * import { Tabs, TabsList, TabsTrigger, TabsContent } from "$lib/design/primitives/tabs";
 * ```
 */

// =============================================================================
// SLOT COMPONENTS
// =============================================================================

export { default as Tabs } from "./Tabs.svelte";
export { default as TabsList } from "./TabsList.svelte";
export { default as TabsTrigger } from "./TabsTrigger.svelte";
export { default as TabsContent } from "./TabsContent.svelte";

// =============================================================================
// TYPES, CONTEXT, CONTRACT
// =============================================================================

export * from "./tabs.js";
