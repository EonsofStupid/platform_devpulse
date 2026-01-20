/**
 * @file primitives/tanstack/render-component.ts
 * @layer primitives
 *
 * Svelte 5 adapter utilities for TanStack Table.
 * Enables rendering Svelte components and snippets in column definitions.
 *
 * Based on: https://github.com/TanStack/table/pull/5403
 */

import type { Component, ComponentProps, Snippet } from "svelte";

/**
 * Configuration class for rendering Svelte components in table cells.
 * Used internally by FlexRender to identify component-based content.
 */
export class RenderComponentConfig<TComponent extends Component<any>> {
  constructor(
    public component: TComponent,
    public props: ComponentProps<TComponent> | Record<string, never> = {}
  ) {}
}

/**
 * Configuration class for rendering Svelte snippets in table cells.
 * Used internally by FlexRender to identify snippet-based content.
 */
export class RenderSnippetConfig<TProps> {
  constructor(
    public snippet: Snippet<[TProps]>,
    public params: TProps
  ) {}
}

/**
 * Helper to render Svelte components in ColumnDef cell/header properties.
 *
 * @example
 * ```ts
 * const columns = [
 *   columnHelper.accessor('name', {
 *     header: () => renderComponent(SortHeader, { label: 'Name' }),
 *     cell: (info) => renderComponent(NameCell, { value: info.getValue() }),
 *   }),
 * ];
 * ```
 */
export function renderComponent<
  TComponent extends Component<any>,
  TProps extends ComponentProps<TComponent>
>(component: TComponent, props: TProps): RenderComponentConfig<TComponent> {
  return new RenderComponentConfig(component, props);
}

/**
 * Helper to render Svelte snippets in ColumnDef cell/header properties.
 *
 * @example
 * ```svelte
 * {#snippet nameCell(value: string)}
 *   <span class="name">{value}</span>
 * {/snippet}
 *
 * <script>
 * const columns = [
 *   columnHelper.accessor('name', {
 *     cell: (info) => renderSnippet(nameCell, info.getValue()),
 *   }),
 * ];
 * </script>
 * ```
 */
export function renderSnippet<TProps>(
  snippet: Snippet<[TProps]>,
  params: TProps
): RenderSnippetConfig<TProps> {
  return new RenderSnippetConfig(snippet, params);
}
