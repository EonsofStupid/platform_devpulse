<!--
	@file ProjectDbDevtool.svelte
	@module @devpulse/devtools/system/datastores/project-db

	Per-project LibSQL database manager. Wired against the real
	`project_db_*` Tauri commands:
	- init_project_db
	- project_db_health
	- project_db_list_tables
	- project_db_query
-->
<script lang="ts">
import { Database, FolderTree, Play, Plug, RefreshCw } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/devtools/index.js";
import type {
	ProjectDbHealth,
	ProjectDbQueryResult,
	ProjectDbTableInfo,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

// ── State ──────────────────────────────────────────────────
let projectId = $state("default");
let projectRoot = $state("");
let projectName = $state("My Project");

let health = $state<ProjectDbHealth | null>(null);
let tables = $state<ProjectDbTableInfo[]>([]);
let initResultPath = $state<string | null>(null);

let querySql = $state("SELECT name FROM sqlite_master WHERE type='table';");
let queryResult = $state<ProjectDbQueryResult | null>(null);

let busy = $state(false);
let error = $state<string | null>(null);

// ── Derived shell badge from real health ───────────────────
const badge = $derived<HealthBadge>(
	health === null
		? { state: "unknown", label: "No project opened yet" }
		: health.reachable
			? {
					state: "up",
					label: `Open · ${(health.latency_us / 1000).toFixed(1)} ms`,
				}
			: {
					state: "down",
					label: health.error ?? "Unreachable",
				},
);

// ── Actions ────────────────────────────────────────────────
async function handleInit(): Promise<void> {
	error = null;
	busy = true;
	try {
		const r = await commands.initProjectDb(projectId, projectRoot, projectName);
		if (r.status === "ok") {
			initResultPath = r.data.db_path;
			await refreshHealth();
			await refreshTables();
		} else {
			error = r.error;
		}
	} finally {
		busy = false;
	}
}

async function refreshHealth(): Promise<void> {
	error = null;
	try {
		const r = await commands.projectDbHealth(projectId);
		if (r.status === "ok") {
			health = r.data;
		} else {
			error = r.error;
			health = null;
		}
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}
}

async function refreshTables(): Promise<void> {
	error = null;
	try {
		const r = await commands.projectDbListTables(projectId);
		if (r.status === "ok") {
			tables = r.data;
		} else {
			error = r.error;
			tables = [];
		}
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}
}

async function runQuery(): Promise<void> {
	error = null;
	busy = true;
	try {
		const r = await commands.projectDbQuery(projectId, querySql);
		if (r.status === "ok") {
			queryResult = r.data;
		} else {
			error = r.error;
			queryResult = null;
		}
	} finally {
		busy = false;
	}
}
</script>

<ServiceDevtoolShell
	title="Project DB"
	description="Per-project LibSQL instances · lazy-loaded"
	icon={FolderTree}
	axis="stores"
	accent="cyan"
	health={badge}
>
	{#snippet status()}
		<div class="space-y-3">
			<div class="flex flex-wrap items-center gap-2">
				<Text size="sm" weight="bold">Project ID</Text>
				<input
					type="text"
					bind:value={projectId}
					class="rounded border px-2 py-1 text-sm"
					style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
				/>
				<Button preset="button-ghost" size="sm" onclick={refreshHealth} disabled={busy}>
					<RefreshCw size={12} />
					Refresh
				</Button>
			</div>

			{#if health}
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<div class="flex items-center gap-2 mb-1">
						<Text size="sm" weight="bold">{health.project_id}</Text>
						<Badge variant={health.reachable ? "positive" : "negative"} size="sm">
							{health.reachable ? "Reachable" : "Unreachable"}
						</Badge>
					</div>
					<Text size="xs" color="muted">
						{#if health.reachable}
							SELECT 1 → {(health.latency_us / 1000).toFixed(2)} ms
						{:else if health.error}
							{health.error}
						{/if}
					</Text>
				</div>
			{:else}
				<Text size="sm" color="muted">
					No project opened. Enter a project id + root path in Actions and click Init.
				</Text>
			{/if}

			{#if tables.length > 0}
				<div class="space-y-1">
					<Text size="xs" weight="bold" color="muted">Tables ({tables.length})</Text>
					{#each tables as t (t.name)}
						<div class="flex items-center justify-between rounded px-2 py-1" style="background: var(--surface-base);">
							<Text size="sm">{t.name}</Text>
							<Text size="xs" color="muted">{t.row_count} rows</Text>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-2">
			{#if initResultPath}
				<Text size="sm">
					<strong>DB path:</strong>
					<code class="font-mono text-xs">{initResultPath}</code>
				</Text>
			{:else}
				<Text size="sm" color="muted">
					Project databases live at
					<span class="font-mono text-xs">{`{project_root}/.devpulse/project.db`}</span>.
					Path resolves after Init.
				</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet logs()}
		<div class="space-y-2">
			<Text size="xs" weight="bold" color="muted">Query Console</Text>
			<textarea
				bind:value={querySql}
				rows={3}
				class="w-full rounded p-2 font-mono text-xs"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
			></textarea>
			<Button preset="button-primary" size="sm" onclick={runQuery} disabled={busy || !projectId}>
				<Play size={12} />
				Run
			</Button>
			{#if queryResult}
				<div class="rounded p-2 font-mono text-xs" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<div class="mb-1">
						<Text size="xs" color="muted">
							{queryResult.row_count} row(s) · {queryResult.rows_affected} affected
						</Text>
					</div>
					<pre class="overflow-x-auto whitespace-pre-wrap">{queryResult.rows_json}</pre>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet actions()}
		<div class="space-y-3">
			<div class="space-y-2">
				<Text size="xs" weight="bold" color="muted">Init / Open Project</Text>
				<div class="grid gap-2" style="grid-template-columns: auto 1fr;">
					<Text size="sm">Project ID</Text>
					<input type="text" bind:value={projectId}
						class="rounded px-2 py-1 text-sm"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);" />

					<Text size="sm">Project Root</Text>
					<input type="text" bind:value={projectRoot}
						placeholder="D:\path\to\project"
						class="rounded px-2 py-1 text-sm"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);" />

					<Text size="sm">Display Name</Text>
					<input type="text" bind:value={projectName}
						class="rounded px-2 py-1 text-sm"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);" />
				</div>
				<Button preset="button-primary" size="sm" onclick={handleInit} disabled={busy || !projectId || !projectRoot}>
					<Plug size={12} />
					Init Project DB
				</Button>
			</div>

			<div class="flex gap-2">
				<Button preset="button-ghost" size="sm" onclick={refreshHealth} disabled={busy || !projectId}>
					<Database size={12} />
					Check Health
				</Button>
				<Button preset="button-ghost" size="sm" onclick={refreshTables} disabled={busy || !projectId}>
					<RefreshCw size={12} />
					List Tables
				</Button>
			</div>
		</div>
	{/snippet}

	{#snippet debug()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				Power-user probes. The sanity probe runs <code>SELECT 1</code>
				against the current project's LibSQL via the same Tauri path
				the app uses; a failure points at the per-project connection
				layer, not your query.
			</Text>

			<div class="rounded p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="bold">Sanity probe</Text>
					<Button
						preset="button-primary"
						size="sm"
						onclick={async () => {
							querySql = "SELECT 1 AS probe;";
							await runQuery();
						}}
						disabled={busy || !projectId}
					>
						<Play size={12} />
						Run
					</Button>
				</div>
				{#if queryResult}
					<Text size="xs" color="muted">
						Last result: {queryResult.row_count} row(s) · {queryResult.rows_affected} affected
					</Text>
				{/if}
			</div>

			<div class="rounded p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
				<Text size="sm" weight="bold" class="block mb-1">Connection state</Text>
				<div class="text-xs space-y-1">
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Project ID</span>
						<span class="font-mono">{projectId || "—"}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Reachable</span>
						<span class="font-mono">{health?.reachable ? "yes" : "unchecked"}</span>
					</div>
					{#if initResultPath}
						<div class="flex justify-between gap-2">
							<span style="color: var(--text-secondary)">DB path</span>
							<span class="font-mono text-[10px] truncate">{initResultPath}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>

{#if error}
	<div
		class="fixed bottom-4 right-4 rounded p-3 text-sm"
		style="background: var(--signal-error-subtle, #3b1a1a); border: 1px solid var(--signal-error); color: var(--text-primary); max-width: 30rem;"
	>
		{error}
	</div>
{/if}
