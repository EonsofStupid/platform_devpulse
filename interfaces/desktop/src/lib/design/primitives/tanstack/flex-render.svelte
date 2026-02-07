<!--
  @file primitives/tanstack/flex-render.svelte
  @layer primitives

  Svelte 5 FlexRender component for TanStack Table.
  Renders column definition content (string, function, component, or snippet).

  Based on: https://github.com/TanStack/table/pull/5403
-->
<script
  lang="ts"
  generics="TData, TValue, TContext extends HeaderContext<TData, TValue> | CellContext<TData, TValue>"
>
  import type {
    CellContext,
    ColumnDefTemplate,
    HeaderContext,
  } from "@tanstack/table-core";

  import {
    RenderComponentConfig,
    RenderSnippetConfig,
  } from "./render-component.js";

  interface Props {
    /** The cell or header field of the current cell's column definition */
    content?: TContext extends HeaderContext<TData, TValue>
      ? ColumnDefTemplate<HeaderContext<TData, TValue>>
      : TContext extends CellContext<TData, TValue>
        ? ColumnDefTemplate<CellContext<TData, TValue>>
        : never;
    /** The result of getContext() from the header or cell */
    context: TContext;
  }

  let { content, context }: Props = $props();
</script>

{#if typeof content === "string"}
  {content}
{:else if content instanceof Function}
  {@const result = content(context as any)}
  {#if result instanceof RenderComponentConfig}
    {@const { component: Component, props } = result}
    <Component {...props} />
  {:else if result instanceof RenderSnippetConfig}
    {@const { snippet, params } = result}
    {@render snippet(params)}
  {:else}
    {result}
  {/if}
{/if}
