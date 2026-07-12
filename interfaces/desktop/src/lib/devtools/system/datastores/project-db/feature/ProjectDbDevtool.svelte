<!--
	@file ProjectDbDevtool.svelte
	@module @devpulse/devtools/system/datastores/project-db

	Per-project LibSQL database manager. Wired against the real
	`project_db_*` Tauri commands:
	- init_project_db
	- project_db_health
	- project_db_list_tables
	- project_db_query

	The five-tab contract:
	- Status   — current project id + reachability + table list
	- Config   — resolved on-disk DB path (post-Init)
	- Logs     — `devtools.project-db` scoped tracing tail
	- Actions  — Init / Health / List Tables verbs
	- Debug    — `SELECT 1` sanity probe + connection state dump

	The query console (custom SQL pad) lives in a `extra` tab —
	"Console" — so it doesn't pretend to be either Logs or Config.
-->
<script lang="ts">
import { Database, FolderTree, Play, Plug, RefreshCw, Terminal } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { TextField } from "$lib/design/components/text-field/index.js";
import { Textarea } from "$lib/design/components/textarea/index.js";
import {
	type CapturePayload,
	type ExtraTab,
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
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

const extraTabs: ExtraTab[] = [{ id: "console", label: "Console", Icon: Terminal }];

// ── Capture (copy / export) ────────────────────────────────
// Shell calls this with the active tab id and renders Copy/Export
// when a payload comes back. Anything that contains state worth
// pasting into a report gets a payload — everything else returns
// undefined and the buttons hide.
function captureFor(tabId: string): CapturePayload | undefined {
	switch (tabId) {
		case "status":
			return {
				filename: `project-db-${projectId || "unset"}-status.json`,
				mime: "application/json",
				content: JSON.stringify({ project_id: projectId, health, tables }, null, 2),
			};
		case "config":
			return {
				filename: `project-db-${projectId || "unset"}-config.json`,
				mime: "application/json",
				content: JSON.stringify(
					{
						project_id: projectId,
						project_root: projectRoot,
						project_name: projectName,
						db_path: initResultPath,
					},
					null,
					2,
				),
			};
		case "console":
			return queryResult
				? {
						filename: `project-db-${projectId || "unset"}-query.json`,
						mime: "application/json",
						content: JSON.stringify({ sql: querySql, result: queryResult }, null, 2),
					}
				: undefined;
		case "debug":
			return {
				filename: `project-db-${projectId || "unset"}-debug.txt`,
				mime: "text/plain",
				content: [
					`project_id: ${projectId || "—"}`,
					`reachable: ${health?.reachable ?? "unchecked"}`,
					`latency_us: ${health?.latency_us ?? "—"}`,
					`db_path: ${initResultPath ?? "—"}`,
					`last_query_rows: ${queryResult?.row_count ?? "—"}`,
				].join("\n"),
			};
		default:
			return undefined;
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
	{extraTabs}
	capture={captureFor}
>
	{#snippet status()}
		<div class="project-db__column">
			<div class="project-db__row">
				<div class="project-db__id-field">
					<TextField
						label="Project ID"
						placeholder="default"
						bind:value={projectId}
					/>
				</div>
				<Button preset="ghost" size="sm" onclick={refreshHealth} disabled={busy}>
					<RefreshCw size={12} aria-hidden="true" />
					Refresh
				</Button>
			</div>

			{#if health}
				<div class="project-db__panel">
					<div class="project-db__panel-header">
						<Text size="sm" weight="bold" as="p">{health.project_id}</Text>
						<Badge variant={health.reachable ? "positive" : "negative"} size="sm">
							{health.reachable ? "Reachable" : "Unreachable"}
						</Badge>
					</div>
					<Text size="xs" color="muted" as="p">
						{#if health.reachable}
							Health probe round-trip · {(health.latency_us / 1000).toFixed(2)} ms
						{:else if health.error}
							{health.error}
						{/if}
					</Text>
				</div>
			{:else}
				<Text size="sm" color="muted" as="p">
					No project opened. Enter a project id + root path under Actions, then click Init.
				</Text>
			{/if}

			{#if tables.length > 0}
				<div class="project-db__column project-db__tables">
					<Text size="xs" weight="bold" color="muted" as="p">
						Tables ({tables.length})
					</Text>
					{#each tables as t (t.name)}
						<div class="project-db__table-row">
							<Text size="sm" as="span">{t.name}</Text>
							<Text size="xs" color="muted" as="span">{t.row_count} rows</Text>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="project-db__column">
			{#if initResultPath}
				<Text size="sm" as="p">
					<strong>DB path:</strong>
					<code class="project-db__code">{initResultPath}</code>
				</Text>
			{:else}
				<Text size="sm" color="muted" as="p">
					Project databases live at
					<code class="project-db__code">{`{project_root}/.userdata/project.db`}</code>.
					Path resolves after Init.
				</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet logs()}
		<ScopedLogPanel target="devtools.project-db" limit={100} />
	{/snippet}

	{#snippet actions()}
		<div class="project-db__column">
			<div class="project-db__column">
				<Text size="xs" weight="bold" color="muted" as="p">Init / Open project</Text>
				<TextField label="Project ID" bind:value={projectId} placeholder="default" />
				<TextField
					label="Project root"
					bind:value={projectRoot}
					placeholder="D:\path\to\project"
				/>
				<TextField label="Display name" bind:value={projectName} placeholder="My Project" />
				<Button
					preset="primary"
					size="sm"
					onclick={handleInit}
					disabled={busy || !projectId || !projectRoot}
				>
					<Plug size={12} aria-hidden="true" />
					Init Project DB
				</Button>
			</div>

			<div class="project-db__button-row">
				<Button preset="ghost" size="sm" onclick={refreshHealth} disabled={busy || !projectId}>
					<Database size={12} aria-hidden="true" />
					Check health
				</Button>
				<Button preset="ghost" size="sm" onclick={refreshTables} disabled={busy || !projectId}>
					<RefreshCw size={12} aria-hidden="true" />
					List tables
				</Button>
			</div>
		</div>
	{/snippet}

	{#snippet debug()}
		<div class="project-db__column">
			<Text size="sm" color="muted" as="p">
				Sanity probe runs <code class="project-db__code">SELECT 1</code> through the same
				Tauri path the app uses. A failure here points at the per-project connection
				layer, not your SQL.
			</Text>

			<div class="project-db__panel">
				<div class="project-db__panel-header">
					<Text size="sm" weight="bold" as="p">Sanity probe</Text>
					<Button
						preset="primary"
						size="sm"
						onclick={async () => {
							querySql = "SELECT 1 AS probe;";
							await runQuery();
						}}
						disabled={busy || !projectId}
					>
						<Play size={12} aria-hidden="true" />
						Run
					</Button>
				</div>
				{#if queryResult}
					<Text size="xs" color="muted" as="p">
						Last result · {queryResult.row_count} row(s) · {queryResult.rows_affected} affected
					</Text>
				{/if}
			</div>

			<div class="project-db__panel">
				<Text size="sm" weight="bold" as="p">Connection state</Text>
				<div class="project-db__kv">
					<span class="project-db__kv-label">Project ID</span>
					<span class="project-db__kv-value">{projectId || "—"}</span>
					<span class="project-db__kv-label">Reachable</span>
					<span class="project-db__kv-value">{health?.reachable ? "yes" : "unchecked"}</span>
					{#if initResultPath}
						<span class="project-db__kv-label">DB path</span>
						<span class="project-db__kv-value project-db__kv-truncate">{initResultPath}</span>
					{/if}
				</div>
			</div>
		</div>
	{/snippet}

	{#snippet extra(tabId: string)}
		{#if tabId === "console"}
			<div class="project-db__column">
				<Text size="xs" weight="bold" color="muted" as="p">SQL console</Text>
				<Textarea
					rows={3}
					bind:value={querySql}
					placeholder="SELECT name FROM sqlite_master WHERE type='table';"
					aria-label="SQL to run against the per-project database"
				/>
				<Button
					preset="primary"
					size="sm"
					onclick={runQuery}
					disabled={busy || !projectId}
				>
					<Play size={12} aria-hidden="true" />
					Run
				</Button>
				{#if queryResult}
					<div class="project-db__panel">
						<Text size="xs" color="muted" as="p">
							{queryResult.row_count} row(s) · {queryResult.rows_affected} affected
						</Text>
						<pre class="project-db__pre">{queryResult.rows_json}</pre>
					</div>
				{/if}
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>

{#if error}
	<div class="project-db__error-toast" role="alert">
		<InlineMessage tone="error">{error}</InlineMessage>
	</div>
{/if}

<style>
	.project-db__column {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
	}

	.project-db__row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--space-7);
	}

	.project-db__id-field {
		flex: 1 1 16rem;
	}

	.project-db__button-row {
		display: flex;
		gap: var(--space-7);
	}

	.project-db__panel {
		padding: var(--space-10);
		border-radius: var(--radius-md);
		background: var(--surface-base);
		border: var(--border-width-hairline) solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.project-db__panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-7);
	}

	.project-db__tables {
		gap: var(--space-3);
	}

	.project-db__table-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-3) var(--space-7);
		border-radius: var(--radius-sm);
		background: var(--surface-base);
	}

	.project-db__code {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
	}

	.project-db__kv {
		display: grid;
		grid-template-columns: minmax(0, 8rem) minmax(0, 1fr);
		gap: var(--space-3) var(--space-7);
		font-size: var(--font-size-xs);
	}

	.project-db__kv-label {
		color: var(--text-secondary);
	}

	.project-db__kv-value {
		font-family: var(--font-mono);
		color: var(--text-primary);
	}

	.project-db__kv-truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.project-db__pre {
		overflow-x: auto;
		white-space: pre-wrap;
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--text-primary);
		margin: 0;
	}

	.project-db__error-toast {
		position: fixed;
		bottom: var(--space-12);
		right: var(--space-12);
		max-width: 30rem;
		z-index: 50;
	}
</style>
