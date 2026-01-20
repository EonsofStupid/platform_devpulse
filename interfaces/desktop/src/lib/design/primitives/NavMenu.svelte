<!--
  @file primitives/NavMenu.svelte
  @layer primitives

  Route-aware navigation menu with keyboard support.
  CRITICAL: Never infers labels from URL segments.

  A11y Acceptance: Active route has aria-current="page"
-->
<script lang="ts" module>
  export interface NavMenuItem {
    /** Human-readable label */
    label: string;
    /** Route path */
    href: string;
    /** Icon identifier */
    icon?: string;
    /** Is this item active? */
    active?: boolean;
    /** Is this item disabled? */
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLElement>, BaseProps {
    /** Navigation items */
    items?: NavMenuItem[];
    /** Current pathname for active highlighting */
    pathname?: string;
    /** Orientation */
    orientation?: "horizontal" | "vertical";
    /** Custom item renderer */
    item?: Snippet<[NavMenuItem, number]>;
    /** Aria label for the nav */
    "aria-label"?: string;
  }

  let {
    items = [],
    pathname = "",
    orientation = "horizontal",
    item: itemSlot,
    "aria-label": ariaLabel = "Navigation",
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "NavMenu");

  function isItemActive(navItem: NavMenuItem): boolean {
    if (navItem.active !== undefined) return navItem.active;
    if (navItem.href && pathname) return pathname === navItem.href;
    return false;
  }

  // Keyboard navigation
  let focusedIndex = $state(-1);

  function handleKeyDown(e: KeyboardEvent) {
    const isHorizontal = orientation === "horizontal";
    const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
    const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";

    if (e.key === prevKey) {
      e.preventDefault();
      focusedIndex = focusedIndex <= 0 ? items.length - 1 : focusedIndex - 1;
    } else if (e.key === nextKey) {
      e.preventDefault();
      focusedIndex = focusedIndex >= items.length - 1 ? 0 : focusedIndex + 1;
    } else if (e.key === "Home") {
      e.preventDefault();
      focusedIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      focusedIndex = items.length - 1;
    }
  }
</script>

<nav
  aria-label={ariaLabel}
  class={className}
  data-kind="primitive"
  data-name="NavMenu"
  data-part="root"
  data-orientation={orientation}
  data-id={id}
  {...rest}
>
  <ul
    data-part="list"
    role="list"
    onkeydown={handleKeyDown}
  >
    {#each items as navItem, i}
      <li
        data-part="item"
        data-active={isItemActive(navItem) || undefined}
        data-disabled={navItem.disabled || undefined}
      >
        {#if itemSlot}
          {@render itemSlot(navItem, i)}
        {:else}
          <a
            href={navItem.disabled ? undefined : navItem.href}
            aria-current={isItemActive(navItem) ? "page" : undefined}
            aria-disabled={navItem.disabled || undefined}
            tabindex={navItem.disabled ? -1 : (focusedIndex === i ? 0 : -1)}
            data-part="link"
          >
            {navItem.label}
          </a>
        {/if}
      </li>
    {/each}
  </ul>
</nav>
