<!--
  @file primitives/DataTable.svelte
  @layer primitives

  Feature primitive: TanStack Table integration with full accessibility.
  Uses native <table> semantics (not role="grid" until full keyboard nav implemented).

  CRITICAL: We own accessibility compliance - TanStack Table is headless.

  A11y Acceptance: Column sort state announced on sort change
-->
<script lang="ts" module>
  import type {
    Table,
    ColumnDef,
    Row,
    Header,
    Cell,
    SortDirection,
  } from "@tanstack/table-core";

  export type { Table, ColumnDef, Row, Header, Cell, SortDirection };

  export interface DataTableProps<TData> {
    /** TanStack Table instance */
    table: Table<TData>;
    /** Table caption (required for accessibility) */
    caption?: string;
    /** Hide caption visually (still read by SR) */
    captionHidden?: boolean;
  }
</script>

<script lang="ts" generics="TData">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";
  import { FlexRender } from "./tanstack/index.js";
  import type { Table as TableType } from "@tanstack/table-core";

  interface Props extends OmitStyle<HTMLTableElement>, BaseProps {
    /** TanStack Table instance */
    table: TableType<TData>;
    /** Table caption (required for accessibility) */
    caption?: string;
    /** Hide caption visually */
    captionHidden?: boolean;
    /** Custom header cell renderer */
    headerCell?: Snippet<[Header<TData, unknown>]>;
    /** Custom body cell renderer */
    bodyCell?: Snippet<[Cell<TData, unknown>]>;
    /** Custom row renderer */
    row?: Snippet<[Row<TData>]>;
    /** Empty state */
    empty?: Snippet;
  }

  let {
    table,
    caption,
    captionHidden = false,
    headerCell,
    bodyCell,
    row: rowSlot,
    empty,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "DataTable");

  // Get sort direction for aria-sort
  function getAriaSort(header: Header<TData, unknown>): "ascending" | "descending" | "none" | undefined {
    if (!header.column.getCanSort()) return undefined;

    const sorted = header.column.getIsSorted();
    if (sorted === "asc") return "ascending";
    if (sorted === "desc") return "descending";
    return "none";
  }

  // Generate stable unique ID for caption
  const fallbackId = Math.random().toString(36).slice(2);
  const captionId = $derived(`datatable-caption-${id ?? fallbackId}`);
</script>

<table
  aria-labelledby={caption ? captionId : undefined}
  class={className}
  data-kind="primitive"
  data-name="DataTable"
  data-part="root"
  data-id={id}
  {...rest}
>
  {#if caption}
    <caption
      id={captionId}
      class:sr-only={captionHidden}
      data-part="caption"
    >
      {caption}
    </caption>
  {/if}

  <thead data-part="head">
    {#each table.getHeaderGroups() as headerGroup}
      <tr data-part="header-row">
        {#each headerGroup.headers as header}
          <th
            scope="col"
            aria-sort={getAriaSort(header)}
            data-part="header-cell"
            data-sortable={header.column.getCanSort() || undefined}
            data-sorted={header.column.getIsSorted() || undefined}
          >
            {#if headerCell}
              {@render headerCell(header)}
            {:else if !header.isPlaceholder}
              {#if header.column.getCanSort()}
                <button
                  type="button"
                  onclick={() => header.column.toggleSorting()}
                  data-part="sort-button"
                >
                  <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                </button>
              {:else}
                <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
              {/if}
            {/if}
          </th>
        {/each}
      </tr>
    {/each}
  </thead>

  <tbody data-part="body">
    {#if table.getRowModel().rows.length === 0}
      {#if empty}
        <tr data-part="empty-row">
          <td colspan={table.getAllColumns().length} data-part="empty-cell">
            {@render empty()}
          </td>
        </tr>
      {/if}
    {:else}
      {#each table.getRowModel().rows as tableRow}
        {#if rowSlot}
          {@render rowSlot(tableRow)}
        {:else}
          <tr
            data-part="body-row"
            data-selected={tableRow.getIsSelected() || undefined}
          >
            {#each tableRow.getVisibleCells() as cell}
              <td data-part="body-cell">
                {#if bodyCell}
                  {@render bodyCell(cell)}
                {:else}
                  <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                {/if}
              </td>
            {/each}
          </tr>
        {/if}
      {/each}
    {/if}
  </tbody>
</table>
