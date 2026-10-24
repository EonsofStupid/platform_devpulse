<!--
	@file TursoDevtool.svelte
	@module @devpulse/devtools/system/datastores/turso

	The database devtool for DevPulse's Turso databases — your data
	(`user.db`) and the platform's (`platform.db`). Wraps
	`ServiceDevtoolShell`:

	- Status — is each database reachable, and where its file is.
	- Tables — browse and edit rows without SQL (TursoTableEditor).
	- Migrations — every schema update this build ships, and when it ran.
	- SQL console — run a statement directly.
	- Logs — row changes (`devtools.turso`) and migrations (`db.migrate`).

	All data comes from Rust; every change is checked there first.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Table } from "@devpulse/coldlight/components/table";
import { Text } from "@devpulse/coldlight/components/text";
import { Textarea } from "@devpulse/coldlight/components/textarea";
import { Database, History, RefreshCw, Table2, Terminal } from "lucide-svelte";
import { onMount } from "svelte";
import {
	DevtoolLogsTab,
	type ExtraTab,
	type HealthBadge,
	type LogTargetPreset,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import { StoreHeroCard } from "$lib/devtools/system/datastores/_shared/index.js";
import { cellText, type TursoDatabase, tursoState } from "$lib/domains/infra/turso/index.js";
import TursoHero from "./TursoHero.svelte";
import TursoTableEditor from "./TursoTableEditor.svelte";

const DATABASES: { value: TursoDatabase; label: string; file: string }[] = [
	{ value: "User", label: "Your data", file: "user.db" },
	{ value: "System", label: "Platform", file: "platform.db" },
];

const LOG_TARGETS: LogTargetPreset[] = [
	{ value: "devtools.turso", label: "Row changes" },
	{ value: "db.migrate", label: "Migrations" },
	{ value: "", label: "All targets" },
];

const extraTabs: ExtraTab[] = [
	{ id: "tables", label: "Tables", Icon: Table2 },
	{ id: "migrations", label: "Migrations", Icon: History },
	{ id: "console", label: "SQL console", Icon: Terminal },
];

onMount(() => {
	if (!tursoState.health && !tursoState.healthLoading) void tursoState.refreshHealth();
	void tursoState.selectDatabase(tursoState.database);
});

type StoreHealth = "up" | "starting" | "degraded" | "down" | "unknown";

const total = $derived(tursoState.health?.length ?? 0);
const heroState = $derived<StoreHealth>(
	tursoState.healthLoading
		? "starting"
		: tursoState.healthError
			? "down"
			: total === 0
				? "unknown"
				: tursoState.reachableCount === total
					? "up"
					: tursoState.reachableCount > 0
						? "degraded"
						: "down",
);
const heroLatencyMs = $derived.by(() => {
	const reachable = tursoState.health?.filter((d) => d.reachable) ?? [];
	if (reachable.length === 0) return null;
	return reachable.reduce((sum, d) => sum + d.latencyUs, 0) / reachable.length / 1000;
});
const heroLabel = $derived(
	heroState === "starting"
		? "Checking…"
		: heroState === "up"
			? `${total} reachable`
			: heroState === "degraded"
				? `${tursoState.reachableCount}/${total} reachable`
				: heroState === "down"
					? "Unreachable"
					: "Not checked yet",
);
const badge = $derived<HealthBadge>({
	state: heroState,
	label: heroLabel,
});

function latency(us: number): string {
	return us >= 1000 ? `${Math.round(us / 1000)} ms` : `${us} µs`;
}

function appliedAt(seconds: number): string {
	return new Date(seconds * 1000).toLocaleString();
}
</script>

<ServiceDevtoolShell
	health={badge}
	{extraTabs}
>
	{#snippet status()}
		<div class="flex flex-col gap-[var(--space-3)]">
			<StoreHeroCard
				purpose="DevPulse's own database — your profile, preferences, projects and chats, and the platform's state"
				health={heroState}
				latencyMs={heroLatencyMs}
				healthLabel={heroLabel}
				activityTick={tursoState.healthChecks}
			>
				<TursoHero state={heroState} />
			</StoreHeroCard>

			{#if tursoState.healthError}
				<InlineMessage tone="error">{tursoState.healthError}</InlineMessage>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-2)]">
				{#each tursoState.health ?? [] as db (db.database)}
					{@const meta = DATABASES.find((d) => d.value === db.database)}
					<div
						class="flex flex-col gap-[var(--space-1)] rounded-lg p-[var(--space-3)]"
						style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
					>
						<div class="flex items-center justify-between gap-[var(--space-2)]">
							<Text size="sm" weight="semibold">{meta?.label ?? db.database}</Text>
							<Badge size="sm" variant={db.reachable ? "positive" : "negative"} fillStyle="subtle">
								{db.reachable ? latency(db.latencyUs) : "Down"}
							</Badge>
						</div>
						<Text size="xs" class="font-mono break-all" style="color: var(--text-secondary);">
							{db.path ?? "not open"}
						</Text>
						{#if db.error}
							<InlineMessage tone="error">{db.error}</InlineMessage>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/snippet}

	{#snippet config()}
		<div class="flex flex-col gap-[var(--space-2)]">
			<Text size="sm" style="color: var(--text-secondary);">
				Where each database lives and how long a write waits for a busy
				database (<code>busy_timeout_ms</code>) are set in
				<code>config/platform/services/system/turso.toml</code>. Change the
				file and restart DevPulse to apply.
			</Text>
			<Text size="sm" style="color: var(--text-secondary);">
				Schema changes ship as numbered migrations in
				<code>systems/devpulse-engine/migrations/</code> and run when a
				database opens — see the Migrations tab.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<DevtoolLogsTab targetPresets={LOG_TARGETS} />
	{/snippet}

	{#snippet actions()}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-3)]">
			<div
				class="flex flex-col gap-[var(--space-2)] p-[var(--space-3)] rounded-lg"
				style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
			>
				<Text size="sm" weight="semibold">Check databases</Text>
				<Text size="xs" style="color: var(--text-secondary);">Ping each database and refresh its round-trip time.</Text>
				<Button
					variant="primary"
					size="sm"
					onclick={() => tursoState.refreshHealth()}
					disabled={tursoState.healthLoading}
				>
					{#if tursoState.healthLoading}<Spinner size="xs" tone="accent" />{:else}<RefreshCw size={14} />{/if}
					Check now
				</Button>
			</div>
			<div
				class="flex flex-col gap-[var(--space-2)] p-[var(--space-3)] rounded-lg"
				style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
			>
				<Text size="sm" weight="semibold">Reload tables</Text>
				<Text size="xs" style="color: var(--text-secondary);">Re-read the tables and row counts of the selected database.</Text>
				<Button
					variant="primary"
					size="sm"
					onclick={() => tursoState.refreshTables()}
					disabled={tursoState.tablesLoading}
				>
					{#if tursoState.tablesLoading}<Spinner size="xs" tone="accent" />{:else}<Table2 size={14} />{/if}
					Reload
				</Button>
			</div>
		</div>
	{/snippet}

	{#snippet extra(tabId: string)}
		<div class="flex flex-col gap-[var(--space-4)]">
			{@render databasePicker()}
			{#if tabId === "tables"}
				<TursoTableEditor />
			{:else if tabId === "migrations"}
				{@render migrationsBody()}
			{:else if tabId === "console"}
				{@render consoleBody()}
			{/if}
		</div>
	{/snippet}
</ServiceDevtoolShell>

{#snippet databasePicker()}
	<div class="flex items-center gap-[var(--space-2)]" role="group" aria-label="Database">
		{#each DATABASES as db (db.value)}
			<Button
				variant={tursoState.database === db.value ? "secondary" : "ghost"}
				size="sm"
				aria-pressed={tursoState.database === db.value}
				onclick={() => tursoState.selectDatabase(db.value)}
			>
				{db.label}
				<span class="font-mono" style="color: var(--text-muted);">{db.file}</span>
			</Button>
		{/each}
	</div>
{/snippet}

{#snippet migrationsBody()}
	<div class="flex flex-col gap-[var(--space-2)]">
		{#if tursoState.migrationsError}
			<InlineMessage tone="error">{tursoState.migrationsError}</InlineMessage>
		{:else if tursoState.migrationsLoading}
			<Spinner size="sm" tone="accent" />
		{:else if tursoState.migrations.length === 0}
			<Text size="sm" style="color: var(--text-secondary);">
				No migrations ship for this database yet — its tables are exactly the base schema.
			</Text>
		{:else}
			{#each tursoState.migrations as m (m.version)}
				<div
					class="flex items-center justify-between gap-[var(--space-2)] rounded-lg p-[var(--space-2)]"
					style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
				>
					<div class="flex items-center gap-[var(--space-2)] min-w-0">
						<Text size="xs" class="font-mono" style="color: var(--text-muted);">
							{String(m.version).padStart(4, "0")}
						</Text>
						<Text size="sm" class="font-mono truncate">{m.name}</Text>
					</div>
					{#if m.appliedAt !== null}
						<Badge size="sm" variant="positive" fillStyle="subtle">Applied {appliedAt(m.appliedAt)}</Badge>
					{:else}
						<Badge size="sm" variant="notice" fillStyle="subtle">Pending</Badge>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
{/snippet}

{#snippet consoleBody()}
	<div class="flex flex-col gap-[var(--space-3)]">
		<Textarea
			rows={4}
			value={tursoState.sql}
			onValueChange={(v) => (tursoState.sql = v)}
			placeholder="SELECT * FROM profiles;"
			aria-label="SQL statement"
			class="font-mono"
			onkeydown={(e: KeyboardEvent) => {
				if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void tursoState.runConsole();
			}}
		/>
		<div class="flex items-center justify-between gap-[var(--space-2)]">
			<Text size="xs" style="color: var(--text-muted);">Ctrl+Enter runs it. Changes made here are logged.</Text>
			<Button
				variant="primary"
				size="sm"
				onclick={() => tursoState.runConsole()}
				disabled={tursoState.running || !tursoState.sql.trim()}
			>
				{tursoState.running ? "Running…" : "Run"}
			</Button>
		</div>

		{#if tursoState.sqlHistory.length > 0}
			<div class="flex flex-wrap gap-[var(--space-1)]">
				{#each tursoState.sqlHistory.slice(0, 8) as q (q)}
					<Button variant="ghost" size="sm" class="font-mono max-w-[16rem] truncate" onclick={() => (tursoState.sql = q)}>
						{q}
					</Button>
				{/each}
			</div>
		{/if}

		{#if tursoState.consoleError}
			<InlineMessage tone="error">{tursoState.consoleError}</InlineMessage>
		{/if}

		{#if tursoState.outcome}
			{@const outcome = tursoState.outcome}
			{#if outcome.rows.length === 0}
				<Text size="sm" style="color: var(--text-secondary);">
					{outcome.rowsAffected > 0 ? `${outcome.rowsAffected} rows changed.` : "No rows."}
				</Text>
			{:else}
				<Text size="xs" style="color: var(--text-secondary);">{outcome.rows.length} rows</Text>
				<div class="rounded-lg overflow-auto max-h-96" style="border: 1px solid var(--border-subtle);">
					<Table label="Result" class="w-full text-xs">
						<tbody>
							{#each outcome.rows as cells, r (r)}
								<tr style="border-top: 1px solid var(--border-subtle);">
									{#each cells as cell, c (c)}
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
			{/if}
		{/if}
	</div>
{/snippet}
