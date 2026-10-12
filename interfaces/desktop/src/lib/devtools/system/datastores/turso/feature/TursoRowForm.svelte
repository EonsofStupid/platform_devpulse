<!--
	@file TursoRowForm.svelte
	@module @devpulse/devtools/system/datastores/turso

	Edit one row, or fill in a new one: a field per column, chosen by the
	column's type (number field for numbers, text area for text), an "Empty"
	switch on columns that may be empty, and badges for key / required.

	The form only reports what changed. Rust checks every change against the
	table's columns and refuses what doesn't fit; its message is shown here.
	A new row sends only the fields you filled in, so the rest take their
	defaults. Mount one form per row (keyed by rowid): the fields read their
	starting value once.
-->
<script lang="ts">
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { NumberField } from "$lib/design/components/number-field/index.js";
import { Switch } from "$lib/design/components/switch/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Textarea } from "$lib/design/components/textarea/index.js";
import {
	AFFINITY_LABEL,
	type Affinity,
	type Cell,
	type CellChange,
	type Column,
	type Row,
} from "$lib/domains/infra/turso/index.js";

interface Props {
	table: string;
	columns: Column[];
	/** The row to edit; `null` fills in a new row. */
	row: Row | null;
	busy: boolean;
	error: string | null;
	onSave: (changes: CellChange[]) => void;
	onCancel: () => void;
	/** Shown for an existing row. */
	onDelete?: () => void;
}

let { table, columns, row, busy, error, onSave, onCancel, onDelete }: Props = $props();

/** Values the user has set, by column. Absent = unchanged / left to default. */
let draft = $state<Record<string, Cell>>({});

function original(index: number): Cell | undefined {
	return row?.cells[index];
}

function current(column: Column, index: number): Cell | undefined {
	return draft[column.name] ?? original(index);
}

function same(a: Cell | undefined, b: Cell | undefined): boolean {
	if (!a || !b) return a === b;
	if (a.kind === "null" || b.kind === "null") return a.kind === b.kind;
	return a.kind === b.kind && a.value === b.value;
}

function isNumberField(column: Column, cell: Cell | undefined): boolean {
	if (column.affinity === "blob") return cell?.kind === "integer" || cell?.kind === "real";
	return column.affinity !== "text";
}

function numberCell(affinity: Affinity, value: number): Cell {
	if (affinity === "real") return { kind: "real", value };
	return Number.isInteger(value) ? { kind: "integer", value } : { kind: "real", value };
}

function numberOf(cell: Cell | undefined): number {
	return cell?.kind === "integer" || cell?.kind === "real" ? cell.value : 0;
}

function textOf(cell: Cell | undefined): string {
	if (!cell || cell.kind === "null" || cell.kind === "blob") return "";
	return String(cell.value);
}

function setEmpty(column: Column, index: number, empty: boolean): void {
	if (empty) {
		draft[column.name] = { kind: "null" };
		return;
	}
	const was = original(index);
	draft[column.name] =
		was && was.kind !== "null"
			? was
			: isNumberField(column, undefined)
				? numberCell(column.affinity, 0)
				: { kind: "text", value: "" };
}

const changes = $derived<CellChange[]>(
	columns.flatMap((column, index) => {
		const value = draft[column.name];
		if (!value || (row && same(value, original(index)))) return [];
		return [{ column: column.name, value }];
	}),
);

function hint(column: Column): string {
	if (column.defaultValue !== null) return `Left blank: ${column.defaultValue}`;
	if (column.nullable) return "Left blank: empty";
	return "";
}
</script>

<form
	class="flex flex-col gap-[var(--space-4)] p-[var(--space-4)]"
	onsubmit={(e) => {
		e.preventDefault();
		onSave(changes);
	}}
>
	<div class="flex flex-col gap-[var(--space-1)]">
		<Text size="lg" weight="semibold">{row ? `Edit row ${row.rowid}` : "Add a row"}</Text>
		<Text size="xs" style="color: var(--text-secondary);">
			{table} · {row ? "change any field, then save" : "fill in what you need; the rest take their defaults"}
		</Text>
	</div>

	{#each columns as column, index (column.name)}
		{@const cell = current(column, index)}
		<div class="flex flex-col gap-[var(--space-1)]">
			<div class="flex items-center justify-between gap-[var(--space-2)]">
				<Text size="sm" weight="semibold" class="font-mono">{column.name}</Text>
				<div class="flex items-center gap-[var(--space-1)]">
					<Badge size="sm" variant="neutral" fillStyle="subtle">{AFFINITY_LABEL[column.affinity]}</Badge>
					{#if column.primaryKey}
						<Badge size="sm" variant="informative" fillStyle="subtle">Key</Badge>
					{/if}
					{#if !column.nullable}
						<Badge size="sm" variant="notice" fillStyle="subtle">Required</Badge>
					{/if}
				</div>
			</div>

			{#if cell?.kind === "blob"}
				<Text size="xs" style="color: var(--text-secondary);">
					Binary data · {cell.value} bytes (not editable here)
				</Text>
			{:else}
				{#if row && column.nullable}
					<div class="flex items-center gap-[var(--space-2)]">
						<Switch
							size="sm"
							checked={cell?.kind === "null"}
							onCheckedChange={(empty) => setEmpty(column, index, empty)}
							aria-label={`${column.name} is empty`}
						/>
						<Text size="xs" style="color: var(--text-secondary);">Empty</Text>
					</div>
				{/if}
				{#if cell?.kind !== "null" || !row}
					{#if isNumberField(column, cell)}
						<NumberField
							size="sm"
							value={numberOf(cell)}
							step={column.affinity === "real" ? 0.1 : 1}
							onValueChange={(v) => (draft[column.name] = numberCell(column.affinity, v))}
							aria-label={column.name}
						/>
					{:else}
						<Textarea
							size="sm"
							rows={textOf(cell).length > 80 ? 4 : 1}
							value={textOf(cell)}
							onValueChange={(v) => (draft[column.name] = { kind: "text", value: v })}
							aria-label={column.name}
						/>
					{/if}
				{/if}
				{#if !row && hint(column)}
					<Text size="xs" style="color: var(--text-muted);">{hint(column)}</Text>
				{/if}
			{/if}
		</div>
	{/each}

	{#if error}
		<InlineMessage tone="error">{error}</InlineMessage>
	{/if}

	<div
		class="sticky bottom-0 flex items-center justify-between gap-[var(--space-2)] py-[var(--space-3)]"
		style="background: var(--surface-raised); border-top: 1px solid var(--border-subtle);"
	>
		<div>
			{#if row && onDelete}
				<Button preset="danger" size="sm" type="button" onclick={onDelete} disabled={busy}>
					Delete row
				</Button>
			{/if}
		</div>
		<div class="flex items-center gap-[var(--space-2)]">
			<Button preset="ghost" size="sm" type="button" onclick={onCancel} disabled={busy}>Cancel</Button>
			<Button preset="primary" size="sm" type="submit" disabled={busy || changes.length === 0}>
				{busy ? "Saving…" : row ? "Save changes" : "Add row"}
			</Button>
		</div>
	</div>
</form>
