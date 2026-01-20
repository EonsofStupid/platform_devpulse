/**
 * @file primitives/tanstack/table.svelte.ts
 * @layer primitives
 *
 * Svelte 5 reactive table factory for TanStack Table.
 * Uses $state and $effect.pre for reactivity instead of stores.
 *
 * Based on: https://github.com/TanStack/table/pull/5403
 */

import {
  createTable,
  type RowData,
  type TableOptions,
  type TableOptionsResolved,
  type TableState,
} from "@tanstack/table-core";

/**
 * Creates a reactive TanStack table instance for Svelte 5.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createSvelteTable, FlexRender } from "$lib/design/primitives/tanstack";
 *
 *   const table = createSvelteTable({
 *     data,
 *     columns,
 *     getCoreRowModel: getCoreRowModel(),
 *   });
 * </script>
 *
 * <table>
 *   {#each table.getHeaderGroups() as headerGroup}
 *     <tr>
 *       {#each headerGroup.headers as header}
 *         <th>
 *           <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
 *         </th>
 *       {/each}
 *     </tr>
 *   {/each}
 * </table>
 * ```
 */
export function createSvelteTable<TData extends RowData>(
  options: TableOptions<TData>
) {
  const resolvedOptions: TableOptionsResolved<TData> = mergeObjects(
    {
      state: {},
      onStateChange() {},
      renderFallbackValue: null,
      mergeOptions: (
        defaultOptions: TableOptions<TData>,
        opts: Partial<TableOptions<TData>>
      ) => {
        return mergeObjects(defaultOptions, opts);
      },
    },
    options
  );

  const table = createTable(resolvedOptions);
  let state = $state<Partial<TableState>>(table.initialState);

  function updateOptions() {
    table.setOptions((prev) => {
      return mergeObjects(prev, options, {
        state: mergeObjects(state, options.state || {}),
        onStateChange: (updater: unknown) => {
          if (updater instanceof Function) {
            state = updater(state);
          } else {
            state = mergeObjects(state, updater as Partial<TableState>);
          }
          options.onStateChange?.(updater as any);
        },
      });
    });
  }

  updateOptions();

  $effect.pre(() => {
    updateOptions();
  });

  return table;
}

/**
 * Merges objects while preserving getters for reactivity.
 * Adapted from SolidJS mergeProps implementation.
 */
export function mergeObjects<T>(source: T): T;
export function mergeObjects<T, U>(source: T, source1: U): T & U;
export function mergeObjects<T, U, V>(
  source: T,
  source1: U,
  source2: V
): T & U & V;
export function mergeObjects<T, U, V, W>(
  source: T,
  source1: U,
  source2: V,
  source3: W
): T & U & V & W;
export function mergeObjects(...sources: unknown[]): unknown {
  const target: Record<string, unknown> = {};

  for (let i = 0; i < sources.length; i++) {
    let source = sources[i];
    if (typeof source === "function") source = source();
    if (source) {
      const descriptors = Object.getOwnPropertyDescriptors(
        source as Record<string, unknown>
      );
      for (const key in descriptors) {
        if (key in target) continue;
        Object.defineProperty(target, key, {
          enumerable: true,
          get() {
            for (let j = sources.length - 1; j >= 0; j--) {
              let s = sources[j];
              if (typeof s === "function") s = s();
              const v = (s as Record<string, unknown> | undefined)?.[key];
              if (v !== undefined) return v;
            }
          },
        });
      }
    }
  }

  return target;
}
