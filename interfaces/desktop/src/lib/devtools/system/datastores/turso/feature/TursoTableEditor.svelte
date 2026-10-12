<!--
	@file TursoTableEditor.svelte
	@module @devpulse/devtools/system/datastores/turso

	Browse and edit a database's rows without writing SQL — the pattern of
	Supabase's Table Editor and Prisma Studio: pick a table, page through its
	rows, open a row in a side sheet to change it, add a row, delete a row
	(confirmed). Rust checks every change and its refusal is shown in place.
-->
<script lang="ts">
import { Plus, RefreshCw, Table2 } from "lucide-svelte";
import { ConfirmDialog } from "$lib/design/blocks/dialogs/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { EmptyState } from "$lib/design/components/empty-state/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { Pagination } from "$lib/design/components/pagination/index.js";
import { Sheet } from "$lib/design/components/sheet/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Table } from "$lib/design/components/table/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	AFFINITY_LABEL,
	type CellChange,
	cellText,
	PAGE_SIZE,
	type Row,
	tursoState,
} from "$lib/domains/infra/turso/index.js";
import TursoRowForm from "./TursoRowForm.svelte";

/** The row open in the sheet: an existing row, or `null` for a new one. */
let editing = $state<{ row: Row | null } | null>(null);
let saving = $state(false);
let saveError = $state<string | null>(null);

let deleting = $state<Row | null>(null);
let deleteBusy = $state(false);
let deleteError = $state<string | null>(null);

const page = $derived(tursoState.page);
const totalPages = $derived(page ? Math.max(1, Math.ceil(page.total / PAGE_SIZE)) : 1);
const currentPage = $derived(page ? Math.floor(page.offset / PAGE_SIZE) + 1 : 1);

function openEditor(row: Row | null): void {
	saveError = null;
	editing = { row };
}

async function save(changes: CellChange[]): Promise<void> {
	if (!editing) return;
	saving = true;
	saveError = null;
	try {
		await tursoState.saveRow(editing.row?.rowid ?? null, changes);
		editing = null;
	} catch (e) {
		saveError = e instanceof Error ? e.message : String(e);
	} finally {
		saving = false;
	}
}

async function confirmDelete(): Promise<void> {
	if (!deleting) return;
	deleteBusy = true;
	deleteError = null;
	try {
		await tursoState.removeRow(deleting.rowid);
		deleting = null;
	} catch (e) {
		deleteError = e instanceof Error ? e.message : String(e);
	} finally {
		deleteBusy = false;
	}
}
</script>

<div class="grid grid-cols-1 lg:grid-cols-[minmax(12rem,16rem)_1fr] gap-[var(--space-4)]">
	<!-- Tables -->
	<nav
		class="flex flex-col gap-[var(--space-1)] lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto"
		aria-label="Tables"
	>
		<div class="flex items-center justify-between gap-[var(--space-2)]">
			<Text size="xs" weight="semibold" style="color: var(--text-secondary);">Tables</Text>
			<Button
				preset="ghost"
				size="sm"
				onclick={() => tursoState.refreshTables()}
				disabled={tursoState.tablesLoading}
				aria-label="Reload tables"
			>
				{#if tursoState.tablesLoading}<Spinner size="xs" tone="accent" />{:else}<RefreshCw size={14} />{/if}
			</Button>
		</div>
		{#if tursoState.tablesError}
			<InlineMessage tone="error">{tursoState.tablesError}</InlineMessage>
		{/if}
		{#each tursoState.tables as table (table.name)}
			<Button
				preset={page?.table === table.name ? "secondary" : "ghost"}
				size="sm"
				class="w-full !justify-between"
				onclick={() => tursoState.openTable(table.name)}
			>
				<span class="font-mono truncate">{table.name}</span>
				<span class="font-mono" style="color: var(--text-muted);">{table.rowCount}</span>
			</Button>
		{/each}
	</nav>

	<!-- Rows -->
	<section class="flex flex-col gap-[var(--space-3)] min-w-0" aria-label="Rows">
		{#if tursoState.pageError}
			<InlineMessage tone="error">{tursoState.pageError}</InlineMessage>
		{/if}

		{#if page}
			<div class="flex items-center justify-between gap-[var(--space-2)]">
				<div class="flex flex-col">
					<Text size="sm" weight="semibold" class="font-mono">{page.table}</Text>
					<Text size="xs" style="color: var(--text-secondary);">
						{page.total} {page.total === 1 ? "row" : "rows"} · {page.columns.length} columns
					</Text>
				</div>
				<Button preset="primary" size="sm" onclick={() => openEditor(null)}>
					<Plus size={14} /> Add row
				</Button>
			</div>

			{#if page.rows.length === 0}
				<EmptyState size="sm">
					<div class="flex flex-col items-center gap-[var(--space-2)]">
						<Table2 size={24} />
						<Text size="sm" weight="semibold">No rows yet</Text>
						<Text size="xs" style="color: var(--text-secondary);">Add one with “Add row”.</Text>
					</div>
				</EmptyState>
			{:else}
				<div class="rounded-lg overflow-hidden" style="border: 1px solid var(--border-subtle);">
					<Table label={`Rows of ${page.table}`} class="w-full text-xs">
						<thead style="background: var(--surface-raised);">
							<tr>
								<th class="px-[var(--space-2)] py-[var(--space-1)]"><span class="sr-only">Edit</span></th>
								{#each page.columns as column (column.name)}
									<th class="text-left px-[var(--space-2)] py-[var(--space-1)] align-bottom">
										<span class="block font-mono" style="color: var(--text-primary);">{column.name}</span>
										<span class="block font-normal" style="color: var(--text-muted);">
											{AFFINITY_LABEL[column.affinity]}{column.primaryKey ? " · key" : ""}
										</span>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each page.rows as row (row.rowid)}
								<tr style="border-top: 1px solid var(--border-subtle);">
									<td class="px-[var(--space-1)] py-[var(--space-1)]">
										<Button preset="ghost" size="sm" onclick={() => openEditor(row)}>Edit</Button>
									</td>
									{#each row.cells as cell, i (page.columns[i]?.name ?? i)}
										<td
											class="px-[var(--space-2)] py-[var(--space-1)] font-mono max-w-[20rem] truncate"
											style="color: {cell.kind === 'null' ? 'var(--text-muted)' : 'var(--text-primary)'};"
											title={cellText(cell)}
										>
											{cellText(cell)}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</Table>
				</div>

				{#if totalPages > 1}
					<Pagination
						page={currentPage}
						{totalPages}
						onPageChange={(p) => tursoState.openTable(page.table, (p - 1) * PAGE_SIZE)}
					/>
				{/if}
			{/if}
		{:else if tursoState.pageLoading}
			<Spinner size="sm" tone="accent" />
		{:else}
			<EmptyState size="sm">
				<div class="flex flex-col items-center gap-[var(--space-2)]">
					<Table2 size={24} />
					<Text size="sm" weight="semibold">Pick a table</Text>
					<Text size="xs" style="color: var(--text-secondary);">
						Its rows open here. Edit a row, add one, or delete one — every change is checked against the table before it's saved.
					</Text>
				</div>
			</EmptyState>
		{/if}
	</section>
</div>

{#if editing && page}
	<Sheet
		open
		side="right"
		size="lg"
		class="overflow-y-auto"
		onOpenChange={(open) => !open && (editing = null)}
	>
		{#key editing.row?.rowid ?? "new"}
			<TursoRowForm
				table={page.table}
				columns={page.columns}
				row={editing.row}
				busy={saving}
				error={saveError}
				onSave={save}
				onCancel={() => (editing = null)}
				onDelete={() => {
					deleteError = null;
					deleting = editing?.row ?? null;
					editing = null;
				}}
			/>
		{/key}
	</Sheet>
{/if}

<ConfirmDialog
	open={deleting !== null}
	title="Delete this row?"
	description={deleting && page ? `Row ${deleting.rowid} of ${page.table} will be removed. This can't be undone.` : ""}
	confirmLabel="Delete row"
	cancelLabel="Keep it"
	destructive
	busy={deleteBusy}
	errorMessage={deleteError}
	onConfirm={confirmDelete}
	onOpenChange={(open) => !open && (deleting = null)}
/>
