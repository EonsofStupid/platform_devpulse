<!--
  @file primitives/Sidebar.svelte
  @layer primitives

  Route-aware sidebar navigation with collapsible sections.
  CRITICAL: Never infers labels from URL segments.
  Uses injected route metadata registry for auto-mode.

  A11y Acceptance: Active route has aria-current="page"
-->
<script lang="ts" module>
  export interface SidebarItem {
    /** Human-readable label */
    label: string;
    /** Route path */
    href?: string;
    /** Icon identifier */
    icon?: string;
    /** Nested items (for sections) */
    children?: SidebarItem[];
    /** Is this item active? */
    active?: boolean;
    /** Is section expanded? */
    expanded?: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";
  import { getRouteMetadata } from "./route-metadata.js";

  interface Props extends OmitStyle<HTMLElement>, BaseProps {
    /** Manual mode: explicitly provide items */
    items?: SidebarItem[];
    /** Current pathname for active highlighting */
    pathname?: string;
    /** Allow multiple sections expanded */
    allowMultiple?: boolean;
    /** Custom item renderer */
    item?: Snippet<[SidebarItem, number]>;
    /** Custom section header renderer */
    sectionHeader?: Snippet<[SidebarItem, boolean, () => void]>;
  }

  let {
    items = [],
    pathname = "",
    allowMultiple = false,
    item: itemSlot,
    sectionHeader,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Sidebar");

  // Track expanded sections
  let expandedSections = $state<Set<number>>(new Set());

  function toggleSection(index: number) {
    if (expandedSections.has(index)) {
      expandedSections.delete(index);
    } else {
      if (!allowMultiple) {
        expandedSections.clear();
      }
      expandedSections.add(index);
    }
    expandedSections = new Set(expandedSections);
  }

  function isItemActive(item: SidebarItem): boolean {
    if (item.active !== undefined) return item.active;
    if (item.href && pathname) return pathname === item.href;
    return false;
  }

  function isSectionExpanded(index: number, item: SidebarItem): boolean {
    if (item.expanded !== undefined) return item.expanded;
    return expandedSections.has(index);
  }
</script>

<nav
  aria-label="Sidebar"
  class={className}
  data-kind="primitive"
  data-name="Sidebar"
  data-part="root"
  data-id={id}
  {...rest}
>
  <ul data-part="list" role="list">
    {#each items as sidebarItem, i}
      <li data-part="item" data-active={isItemActive(sidebarItem) || undefined}>
        {#if sidebarItem.children && sidebarItem.children.length > 0}
          <!-- Section with children -->
          {#if sectionHeader}
            {@render sectionHeader(sidebarItem, isSectionExpanded(i, sidebarItem), () => toggleSection(i))}
          {:else}
            <button
              type="button"
              aria-expanded={isSectionExpanded(i, sidebarItem)}
              data-part="section-trigger"
              onclick={() => toggleSection(i)}
            >
              {sidebarItem.label}
            </button>
          {/if}
          {#if isSectionExpanded(i, sidebarItem)}
            <ul data-part="section-content" role="list">
              {#each sidebarItem.children as child, j}
                <li data-part="child-item" data-active={isItemActive(child) || undefined}>
                  {#if itemSlot}
                    {@render itemSlot(child, j)}
                  {:else if child.href}
                    <a
                      href={child.href}
                      aria-current={isItemActive(child) ? "page" : undefined}
                      data-part="link"
                    >
                      {child.label}
                    </a>
                  {:else}
                    <span data-part="text">{child.label}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        {:else}
          <!-- Single item -->
          {#if itemSlot}
            {@render itemSlot(sidebarItem, i)}
          {:else if sidebarItem.href}
            <a
              href={sidebarItem.href}
              aria-current={isItemActive(sidebarItem) ? "page" : undefined}
              data-part="link"
            >
              {sidebarItem.label}
            </a>
          {:else}
            <span data-part="text">{sidebarItem.label}</span>
          {/if}
        {/if}
      </li>
    {/each}
  </ul>
</nav>
