<!--
  @file primitives/Breadcrumb.svelte
  @layer primitives

  Route-aware breadcrumb with dual-mode data source.
  CRITICAL: Never infers labels from URL segments.
  Uses injected route metadata registry for auto-mode.

  A11y Acceptance: Current page has aria-current="page", is NOT a link
-->
<script lang="ts" module>
  export interface BreadcrumbItem {
    /** Human-readable label (i18n-ready) */
    label: string;
    /** Route path */
    href: string;
    /** Is this the current page? */
    current?: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";
  import { getRouteMetadata } from "./route-metadata.js";

  interface Props extends OmitStyle<HTMLElement>, BaseProps {
    /** Manual mode: explicitly provide items (always wins) */
    items?: BreadcrumbItem[];
    /** Current pathname for auto-mode */
    pathname?: string;
    /** Use route metadata registry for auto-mode */
    useRouteMetadata?: boolean;
    /** Fallback label when metadata missing */
    fallbackLabel?: string;
    /** Separator between items */
    separator?: Snippet;
    /** Custom item renderer */
    item?: Snippet<[BreadcrumbItem]>;
  }

  let {
    items,
    pathname = "",
    useRouteMetadata = true,
    fallbackLabel = "Untitled",
    separator,
    item: itemSlot,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Breadcrumb");

  // Priority: manual items > route metadata > empty
  let resolvedItems = $derived.by(() => {
    // Manual mode always wins
    if (items) return items;

    // Auto mode: use injected route metadata registry
    if (!useRouteMetadata || !pathname) return [];

    return buildFromRouteMetadata(pathname, fallbackLabel);
  });

  function buildFromRouteMetadata(
    path: string,
    fallback: string
  ): BreadcrumbItem[] {
    const segments = path.split("/").filter(Boolean);
    const result: BreadcrumbItem[] = [];
    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
      currentPath += `/${segments[i]}`;
      const metadata = getRouteMetadata(currentPath);

      result.push({
        // NEVER guess from URL segment
        label: metadata?.label ?? fallback,
        href: currentPath,
        current: i === segments.length - 1,
      });
    }

    return result;
  }
</script>

<nav
  aria-label="Breadcrumb"
  class={className}
  data-kind="primitive"
  data-name="Breadcrumb"
  data-part="root"
  data-id={id}
  {...rest}
>
  <ol data-part="list">
    {#each resolvedItems as crumb, i}
      <li data-part="item">
        {#if itemSlot}
          {@render itemSlot(crumb)}
        {:else if crumb.current}
          <span aria-current="page" data-part="current">{crumb.label}</span>
        {:else}
          <a href={crumb.href} data-part="link">{crumb.label}</a>
        {/if}
      </li>
      {#if i < resolvedItems.length - 1}
        <li aria-hidden="true" data-part="separator">
          {#if separator}
            {@render separator()}
          {:else}
            /
          {/if}
        </li>
      {/if}
    {/each}
  </ol>
</nav>
