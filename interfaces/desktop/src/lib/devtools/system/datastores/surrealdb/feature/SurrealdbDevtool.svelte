<!--
	@file SurrealdbDevtool.svelte
	@module @devpulse/devtools/system/datastores/surrealdb

	Unified SurrealDB surface. The previous split (`/devtools/surreal`
	+ `/devtools/surreal/sidecar`) was the overlap the user banned in
	the locked memory `feedback_command_naming_convention.md` —
	"surrealdb is surrealdb, no `_sidecar` decorator at any layer."
	The two devtools are folded into one tabbed shell here:

	  Status   — sidecar runtime + namespace health (the headline
	             "is my graph store working" view)
	  Config   — sidecar overrides (port, binary, creds, log level);
	             persists to `user/surreal.toml`
	  Logs     — `devtools.surreal` scoped log tail
	  Process  — port-bump diagnostics + binary path (deeper sidecar
	             inspection that doesn't belong on the headline tab)
	  Browser  — tables in the active namespace
	  Console  — ad-hoc SurrealQL execution

	Surreal is boot-time critical (graph stores depend on it), so the
	devtool deliberately does NOT expose start/stop/restart actions —
	config saves take effect on the next app launch. The Process tab
	makes that constraint visible.
-->
<script lang="ts">
import {
	AlertCircle,
	Database,
	Globe,
	Network,
	RefreshCw,
	RotateCcw,
	Save,
	ServerCog,
	Terminal,
} from "lucide-svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	type ExtraTab,
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import {
	NAMESPACE_OPTIONS,
	surrealSidecarState as surrealdbSidecar,
	surrealState,
} from "$lib/domains/infra/surreal/index.js";

// ── Mount ─────────────────────────────────────────────────
// `onMount`, not `$effect`: each load*() reads + writes a *Loading
// flag, which `$effect` would track and re-trigger on. (Same trap
// caught earlier in ProjectSwitcher's 1300+ refresh() loop.)
onMount(() => {
	void surrealdbSidecar.loadStatus();
	void surrealdbSidecar.loadHealth();
	void surrealdbSidecar.loadConfig();
	if (!surrealState.health && !surrealState.healthLoading) {
		void surrealState.loadHealth();
	}
});

// ── Tabs ──────────────────────────────────────────────────
const extraTabs: ExtraTab[] = [
	{ id: "process", label: "Process", Icon: ServerCog },
	{ id: "browser", label: "Browser", Icon: Database },
	{ id: "console", label: "Console", Icon: Terminal },
];

// ── Unified health badge ──────────────────────────────────
// Sidecar liveness gates everything — if the process isn't up, the
// namespace count is irrelevant. Once the sidecar is up, the badge
// reports namespace reachability so a degraded graph store surfaces
// even when the process is technically running.
const badge = $derived<HealthBadge>(
	surrealdbSidecar.healthLoading
		? { state: "starting", label: "Checking sidecar…" }
		: surrealdbSidecar.health?.state === "down" || surrealdbSidecar.health?.state === "stopped"
			? { state: "down", label: "Sidecar not running" }
			: surrealState.healthLoading
				? { state: "starting", label: "Checking namespaces…" }
				: surrealState.healthError
					? { state: "degraded", label: "Namespace probe failed" }
					: surrealState.health
						? surrealState.reachableCount === surrealState.health.namespaces.length
							? {
									state: "up",
									label: `${surrealState.reachableCount}/${surrealState.health.namespaces.length} namespaces reachable`,
								}
							: surrealState.reachableCount > 0
								? {
										state: "degraded",
										label: `${surrealState.reachableCount}/${surrealState.health.namespaces.length} reachable`,
									}
								: { state: "down", label: "No namespaces reachable" }
						: { state: "unknown", label: "Not checked yet" },
);

// ── Config draft helpers ──────────────────────────────────
// Inputs use value || null so empty strings become None on the
// Rust side (= "inherit from platform.default.toml").
function updatePort(raw: string) {
	const n = Number.parseInt(raw, 10);
	surrealdbSidecar.draft.port = Number.isFinite(n) && n >= 1024 ? n : null;
}
function updateMaxBumps(raw: string) {
	const n = Number.parseInt(raw, 10);
	surrealdbSidecar.draft.max_bumps = Number.isFinite(n) && n > 0 && n <= 100 ? n : null;
}
function updateBinary(raw: string) {
	surrealdbSidecar.draft.binary_path = raw.trim() === "" ? null : raw;
}
function updateLogLevel(raw: string) {
	surrealdbSidecar.draft.log_level = raw === "" ? null : raw;
}
function updateRootUser(raw: string) {
	surrealdbSidecar.draft.root_user = raw.trim() === "" ? null : raw;
}
function updateRootPassword(raw: string) {
	surrealdbSidecar.draft.root_password = raw === "" ? null : raw;
}

// ── Console handlers ──────────────────────────────────────
function handleQuerySubmit(): void {
	surrealState.executeQuery();
}
function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
		handleQuerySubmit();
	}
}
</script>

<ServiceDevtoolShell
	title="SurrealDB"
	description="Multi-model engine · graph + document · 3 namespaces"
	icon={Network}
	axis="stores"
	accent="violet"
	backdrop="surrealdb"
	health={badge}
	{extraTabs}
>
	<!-- ── STATUS ────────────────────────────────────────── -->
	<!-- Combines sidecar runtime state + namespace reachability cards -->
	{#snippet status()}
		<div class="space-y-5">
			<!-- Sidecar runtime block -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="semibold">Runtime</Text>
					<Button
						preset="ghost"
						size="sm"
						onclick={() => {
							void surrealdbSidecar.loadStatus();
							void surrealdbSidecar.loadHealth();
						}}
						disabled={surrealdbSidecar.healthLoading}
					>
						{#if surrealdbSidecar.healthLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Refresh
					</Button>
				</div>

				{#if surrealdbSidecar.statusError}
					<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
						{surrealdbSidecar.statusError}
					</div>
				{/if}

				{#if surrealdbSidecar.status}
					<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2">
								<Database size={14} class="text-[var(--color-teal-400)]" />
								<Text size="sm" weight="semibold">surreal</Text>
								{#if surrealdbSidecar.status.running}
									{#if surrealdbSidecar.status.managed}
										<Badge tone="positive" size="sm">Managed</Badge>
									{:else}
										<Badge tone="neutral" size="sm">Attached</Badge>
									{/if}
									{#if surrealdbSidecar.bumped}
										<Badge tone="warning" size="sm">
											port +{surrealdbSidecar.status.portBumps}
										</Badge>
									{/if}
								{:else}
									<Badge tone="neutral" size="sm">Stopped</Badge>
								{/if}
							</div>
							<span
								class="inline-block w-2 h-2 rounded-full"
								style="background: {surrealdbSidecar.running
									? 'var(--signal-success)'
									: 'var(--signal-error)'}"
							></span>
						</div>

						<div class="space-y-1 text-xs">
							{#if surrealdbSidecar.status.running}
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Port</span>
									<span class="font-mono">{surrealdbSidecar.portSummary}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">HTTP</span>
									<span class="font-mono">{surrealdbSidecar.status.httpUrl}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">WS</span>
									<span class="font-mono">{surrealdbSidecar.status.wsUrl}</span>
								</div>
							{:else}
								<Text size="xs" color="muted">
									Sidecar not booted — check boot log at <code>.userdata/logs/boot.log</code>.
								</Text>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Namespaces block -->
			<div>
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="semibold">Namespaces</Text>
					<Button
						preset="ghost"
						size="sm"
						onclick={() => surrealState.loadHealth()}
						disabled={surrealState.healthLoading}
					>
						{#if surrealState.healthLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Refresh
					</Button>
				</div>

				{#if surrealState.healthError}
					<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
						{surrealState.healthError}
					</div>
				{/if}

				{#if surrealState.health}
					<div class="text-xs text-[var(--text-secondary)] mb-2">
						Storage:
						<span class="font-mono">{surrealState.health.storage_path}/surreal/devpulse</span>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
						{#each surrealState.health.namespaces as ns}
							<div
								class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
							>
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										<Globe size={14} class="text-[var(--color-teal-400)]" />
										<Text size="sm" weight="semibold">{ns.namespace}</Text>
									</div>
									<span
										class="inline-block w-2 h-2 rounded-full"
										style="background: {ns.reachable
											? 'var(--signal-success)'
											: 'var(--signal-error)'}"
									></span>
								</div>
								<div class="space-y-1 text-xs">
									<div class="flex justify-between">
										<span class="text-[var(--text-secondary)]">Database</span>
										<span class="font-mono">{ns.database}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-[var(--text-secondary)]">Status</span>
										<span
											style="color: {ns.reachable
												? 'var(--signal-success)'
												: 'var(--signal-error)'}"
										>
											{ns.reachable ? "Reachable" : "Down"}
										</span>
									</div>
									{#if ns.reachable}
										<div class="flex justify-between">
											<span class="text-[var(--text-secondary)]">Latency</span>
											<span class="font-mono">
												{ns.latency_us >= 1000
													? `${Math.round(ns.latency_us / 1000)}ms`
													: `${ns.latency_us}µs`}
											</span>
										</div>
									{/if}
									{#if ns.error}
										<div class="mt-1 text-red-400 break-all">{ns.error}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else if surrealState.healthLoading}
					<Text size="sm" color="muted">Pinging namespaces…</Text>
				{:else}
					<Text size="sm" color="muted">Click Refresh to check namespace health.</Text>
				{/if}
			</div>
		</div>
	{/snippet}

	<!-- ── CONFIG ────────────────────────────────────────── -->
	<!-- Sidecar overrides — port, binary, credentials, log level. -->
	{#snippet config()}
		<div class="space-y-3">
			{#if surrealdbSidecar.configError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{surrealdbSidecar.configError}
				</div>
			{/if}

			{#if surrealdbSidecar.needsRestart}
				<div class="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex gap-2">
					<AlertCircle size={14} class="shrink-0 mt-0.5" />
					<div>
						<div class="font-semibold mb-1">Restart to apply</div>
						<div>
							Config saved to <code>user/surreal.toml</code>. Restart the app for changes to take effect — the sidecar
							only reads this file at boot.
						</div>
					</div>
				</div>
			{/if}

			<Text size="xs" color="muted">
				Every field is an override. Leave blank to inherit from
				<code>platform.default.toml</code>. Persists to <code>user/surreal.toml</code>.
			</Text>

			<div class="grid grid-cols-2 gap-3">
				<label class="flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Port</span>
					<input
						type="number"
						min="1024"
						max="65535"
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.port ?? ""}
						placeholder={surrealdbSidecar.status?.configuredPort?.toString() ?? "inherit"}
						oninput={(e) => updatePort(e.currentTarget.value)}
					/>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Max port bumps</span>
					<input
						type="number"
						min="0"
						max="100"
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.max_bumps ?? ""}
						placeholder="20 (default)"
						oninput={(e) => updateMaxBumps(e.currentTarget.value)}
					/>
				</label>

				<label class="col-span-2 flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Binary path</span>
					<input
						type="text"
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.binary_path ?? ""}
						placeholder="(bundled / standard install / PATH)"
						oninput={(e) => updateBinary(e.currentTarget.value)}
					/>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Log level</span>
					<select
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.log_level ?? ""}
						onchange={(e) => updateLogLevel(e.currentTarget.value)}
					>
						<option value="">(inherit)</option>
						<option value="error">error</option>
						<option value="warn">warn</option>
						<option value="info">info</option>
						<option value="debug">debug</option>
						<option value="trace">trace</option>
					</select>
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Root user</span>
					<input
						type="text"
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.root_user ?? ""}
						placeholder="root (default)"
						oninput={(e) => updateRootUser(e.currentTarget.value)}
					/>
				</label>

				<label class="col-span-2 flex flex-col gap-1">
					<span class="text-xs text-[var(--text-secondary)]">Root password</span>
					<input
						type="password"
						class="px-2 py-1 text-xs font-mono rounded border border-[var(--border-subtle)] bg-[var(--surface-base)]"
						value={surrealdbSidecar.draft.root_password ?? ""}
						placeholder="root (default)"
						oninput={(e) => updateRootPassword(e.currentTarget.value)}
					/>
				</label>
			</div>

			<div class="flex gap-2 justify-end pt-2">
				<Button
					preset="ghost"
					size="sm"
					onclick={() => surrealdbSidecar.reset()}
					disabled={!surrealdbSidecar.dirty || surrealdbSidecar.configSaving}
				>
					<RotateCcw size={14} />
					Reset
				</Button>
				<Button
					preset="primary"
					size="sm"
					onclick={() => void surrealdbSidecar.save()}
					disabled={!surrealdbSidecar.dirty || surrealdbSidecar.configSaving}
				>
					{#if surrealdbSidecar.configSaving}
						<Spinner size="xs" tone="accent" />
					{:else}
						<Save size={14} />
					{/if}
					Save
				</Button>
			</div>
		</div>
	{/snippet}

	<!-- ── LOGS ──────────────────────────────────────────── -->
	{#snippet logs()}
		<ScopedLogPanel target="devtools.surreal" />
	{/snippet}

	<!-- ── ACTIONS ───────────────────────────────────────── -->
	{#snippet actions()}
		<div class="space-y-4">
			<Text size="sm" color="muted">
				SurrealDB is boot-time critical — the graph stores depend on it.
				Start / stop / restart deliberately aren't exposed here; instead,
				edit the sidecar overrides in <strong>Config</strong>, save, and
				relaunch the platform. The Process tab shows the running binary's
				path + port-bump history.
			</Text>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
					<Text size="sm" weight="semibold">Refresh runtime + namespaces</Text>
					<Text size="xs" color="muted" class="block mb-2">
						Re-poll the sidecar liveness and ping every namespace.
					</Text>
					<Button
						preset="default"
						size="sm"
						onclick={() => {
							void surrealdbSidecar.loadStatus();
							void surrealdbSidecar.loadHealth();
							void surrealState.loadHealth();
						}}
						disabled={surrealdbSidecar.healthLoading || surrealState.healthLoading}
					>
						{#if surrealdbSidecar.healthLoading || surrealState.healthLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Re-poll
					</Button>
				</div>

				<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
					<Text size="sm" weight="semibold">Reload tables</Text>
					<Text size="xs" color="muted" class="block mb-2">
						Refresh the table catalog for the active namespace.
					</Text>
					<Button
						preset="default"
						size="sm"
						onclick={() => surrealState.loadTables()}
						disabled={surrealState.tablesLoading}
					>
						{#if surrealState.tablesLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<Database size={14} />
						{/if}
						Reload tables
					</Button>
				</div>
			</div>
		</div>
	{/snippet}

	<!-- ── DEBUG ─────────────────────────────────────────── -->
	{#snippet debug()}
		<div class="space-y-4">
			<Text size="sm" color="muted">
				Power-user probes. The sanity probe runs <code>INFO FOR DB</code>
				against the active namespace via the same Tauri path the app
				uses, so a failure here points at the WS connection or
				namespace-scope, not your query.
			</Text>

			<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
				<div class="flex items-center justify-between mb-2">
					<Text size="sm" weight="semibold">Sanity probe</Text>
					<Button
						preset="default"
						size="sm"
						onclick={async () => {
							surrealState.queryInput = "INFO FOR DB;";
							await surrealState.executeQuery();
						}}
						disabled={surrealState.queryLoading}
					>
						{#if surrealState.queryLoading}
							<Spinner size="xs" tone="accent" />
						{:else}
							<RefreshCw size={14} />
						{/if}
						Run
					</Button>
				</div>
				{#if surrealState.queryError}
					<div class="text-xs font-mono text-red-400 break-all">
						error: {surrealState.queryError}
					</div>
				{:else if surrealState.queryResult !== null}
					<div class="text-xs font-mono" style="color: var(--signal-success)">
						ok — {surrealState.queryResult.row_count} rows
					</div>
				{/if}
			</div>

			<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
				<Text size="sm" weight="semibold" class="block mb-2">Sidecar process state</Text>
				<div class="text-xs space-y-1">
					<div class="flex justify-between">
						<span class="text-[var(--text-secondary)]">Running</span>
						<span class="font-mono">{surrealdbSidecar.running ? "yes" : "no"}</span>
					</div>
					{#if surrealdbSidecar.status?.bound_port}
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Port</span>
							<span class="font-mono">{surrealdbSidecar.status.bound_port}</span>
						</div>
					{/if}
					{#if surrealdbSidecar.status?.portBumps !== undefined && surrealdbSidecar.status.portBumps > 0}
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Port bumps</span>
							<span class="font-mono">+{surrealdbSidecar.status.portBumps}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/snippet}

	<!-- ── EXTRAS ────────────────────────────────────────── -->
	{#snippet extra(tabId: string)}
		{#if tabId === "process"}
			{@render processBody()}
		{:else if tabId === "browser"}
			{@render browserBody()}
		{:else if tabId === "console"}
			{@render consoleBody()}
		{/if}
	{/snippet}
</ServiceDevtoolShell>

<!-- ── PROCESS — port-bump + binary path detail ────────── -->
{#snippet processBody()}
	<div class="space-y-4">
		{#if surrealdbSidecar.bumped}
			<div class="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex gap-2">
				<AlertCircle size={14} class="shrink-0 mt-0.5" />
				<div>
					<div class="font-semibold mb-1">Port auto-bumped</div>
					<div>
						The configured port
						<code>:{surrealdbSidecar.status?.configuredPort}</code>
						was held by another process; the allocator landed on
						<code>:{surrealdbSidecar.status?.actualPort}</code>
						instead. Edit the port in Config to pin a different one,
						or free <code>:{surrealdbSidecar.status?.configuredPort}</code>
						and restart.
					</div>
				</div>
			</div>
		{/if}

		{#if surrealdbSidecar.status?.binaryPath}
			<div class="space-y-2">
				<Text size="xs" weight="bold" color="muted">Binary</Text>
				<div
					class="rounded p-2 font-mono text-xs"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					{surrealdbSidecar.status.binaryPath}
				</div>
			</div>
		{/if}

		{#if surrealdbSidecar.status?.running}
			<div class="space-y-2">
				<Text size="xs" weight="bold" color="muted">Endpoints</Text>
				<div class="grid grid-cols-1 gap-1 text-xs">
					<div class="flex justify-between rounded px-2 py-1 font-mono" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
						<span class="text-[var(--text-secondary)]">HTTP</span>
						<span>{surrealdbSidecar.status.httpUrl}</span>
					</div>
					<div class="flex justify-between rounded px-2 py-1 font-mono" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
						<span class="text-[var(--text-secondary)]">WS</span>
						<span>{surrealdbSidecar.status.wsUrl}</span>
					</div>
				</div>
			</div>
		{:else}
			<Text size="sm" color="muted">
				Sidecar is not running. Boot the app to spawn it; this devtool
				cannot start it manually because Surreal is boot-time critical
				for the graph stage.
			</Text>
		{/if}
	</div>
{/snippet}

<!-- ── BROWSER — tables in active namespace ────────────── -->
{#snippet browserBody()}
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Text size="sm" weight="semibold">Tables in {surrealState.activeNamespace}</Text>
				<select
					class="bg-[var(--surface-raised)] text-xs border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
					value={surrealState.activeNamespace}
					onchange={(e) =>
						surrealState.setNamespace(
							(e.target as HTMLSelectElement)
								.value as (typeof NAMESPACE_OPTIONS)[number]["value"],
						)}
				>
					{#each NAMESPACE_OPTIONS as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
			<Button
				preset="ghost"
				size="sm"
				onclick={() => surrealState.loadTables()}
				disabled={surrealState.browserLoading}
			>
				{#if surrealState.browserLoading}
					<Spinner size="xs" tone="accent" />
				{:else}
					<RefreshCw size={14} />
				{/if}
				Refresh
			</Button>
		</div>

		{#if surrealState.browserError}
			<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
				{surrealState.browserError}
			</div>
		{/if}

		{#if surrealState.stats}
			<div class="flex gap-4 text-xs text-[var(--text-secondary)]">
				<span>{surrealState.stats.table_count} tables</span>
				<span>{surrealState.stats.total_records} total records</span>
				<span class="font-mono">
					{surrealState.stats.namespace}/{surrealState.stats.database}
				</span>
			</div>

			<div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
				<table class="w-full text-xs">
					<thead>
						<tr class="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
							<th class="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Table</th>
							<th class="text-right px-3 py-2 font-medium text-[var(--text-secondary)]">Records</th>
						</tr>
					</thead>
					<tbody>
						{#each surrealState.tables as table}
							<tr class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]">
								<td class="px-3 py-2 font-mono">{table.name}</td>
								<td class="px-3 py-2 text-right font-mono">{table.record_count}</td>
							</tr>
						{/each}
						{#if surrealState.tables.length === 0}
							<tr>
								<td colspan="2" class="px-3 py-4 text-center text-[var(--text-secondary)]">
									No tables found
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>

			{#if surrealState.kvEntries.length > 0}
				<div class="mt-4">
					<Text size="xs" weight="semibold" color="secondary">
						KV Store ({surrealState.kvEntries.length} keys)
					</Text>
					<div class="mt-2 rounded-lg border border-[var(--border-subtle)] overflow-hidden">
						<table class="w-full text-xs">
							<thead>
								<tr class="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]">
									<th class="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Key</th>
									<th class="text-right px-3 py-2 font-medium text-[var(--text-secondary)]">Size</th>
								</tr>
							</thead>
							<tbody>
								{#each surrealState.kvEntries as entry}
									<tr class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]">
										<td class="px-3 py-2 font-mono">{entry.key}</td>
										<td class="px-3 py-2 text-right font-mono">{entry.value_size}B</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		{:else if surrealState.browserLoading}
			<Text size="sm" color="muted">Loading tables…</Text>
		{:else}
			<Text size="sm" color="muted">Select a namespace and click Refresh.</Text>
		{/if}
	</div>
{/snippet}

<!-- ── CONSOLE — SurrealQL ad-hoc queries ──────────────── -->
{#snippet consoleBody()}
	<div class="space-y-4">
		<div class="flex items-center gap-2">
			<Text size="sm" weight="semibold">SurrealQL Console</Text>
			<Text size="xs" color="secondary">Targeting: {surrealState.activeNamespace}</Text>
			<select
				class="bg-[var(--surface-raised)] text-xs border border-[var(--border-subtle)] rounded px-2 py-1 text-[var(--text-primary)]"
				value={surrealState.activeNamespace}
				onchange={(e) =>
					surrealState.setNamespace(
						(e.target as HTMLSelectElement)
							.value as (typeof NAMESPACE_OPTIONS)[number]["value"],
					)}
			>
				{#each NAMESPACE_OPTIONS as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>

		<div class="relative">
			<textarea
				class="w-full h-28 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] resize-y focus:border-[var(--color-teal-500)] focus:outline-none"
				placeholder="SELECT * FROM kv LIMIT 10;"
				bind:value={surrealState.queryInput}
				onkeydown={handleKeydown}
			></textarea>
			<div class="absolute bottom-2 right-2 flex items-center gap-2">
				<span class="text-[10px] text-[var(--text-secondary)]">Ctrl+Enter to run</span>
				<Button
					preset="default"
					size="sm"
					onclick={handleQuerySubmit}
					disabled={surrealState.queryLoading || !surrealState.queryInput.trim()}
				>
					{surrealState.queryLoading ? "Running…" : "Execute"}
				</Button>
			</div>
		</div>

		{#if surrealState.queryHistory.length > 0}
			<div>
				<Text size="xs" weight="semibold" color="secondary">History</Text>
				<div class="mt-1 flex flex-wrap gap-1">
					{#each surrealState.queryHistory.slice(0, 8) as q}
						<button
							type="button"
							class="px-2 py-0.5 text-[10px] font-mono rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] truncate max-w-[200px]"
							onclick={() => surrealState.setQueryFromHistory(q)}
						>
							{q}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if surrealState.queryError}
			<div
				class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono break-all"
			>
				{surrealState.queryError}
			</div>
		{/if}

		{#if surrealState.queryResult !== null}
			<div>
				<div class="flex items-center justify-between mb-1">
					<Text size="xs" weight="semibold" color="secondary">Result</Text>
					<button
						type="button"
						class="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
						onclick={() => surrealState.clearResult()}
					>
						Clear
					</button>
				</div>
				<pre
					class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs font-mono overflow-auto max-h-80 text-[var(--text-primary)]">{JSON.stringify(surrealState.queryResult, null, 2)}</pre>
			</div>
		{/if}
	</div>
{/snippet}
