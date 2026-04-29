<!--
	@file /devtools/ollama — Ollama runtime devtool
	@route /devtools/ollama

	Live controls for the managed `ollama serve` child process. Wires
	through `ollamaSidecarState` + the specta bindings to the engine's
	`OllamaService` (kernel adapter `OllamaAdapter`).
-->
<script lang="ts">
import { Boxes, Download, Play, PowerOff, RefreshCw, Trash2 } from "lucide-svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { ollamaSidecarState } from "$lib/domains/infra/ollama/index.js";
import {
	type CapturePayload,
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/domains/platform/index.js";

// ── Mount: prime status + config on first render ──────────
// Use `onMount`, NOT `$effect`. Each `loadXxx()` flips a `*Loading`
// flag (read → write); `$effect` would track that flag and re-fire
// indefinitely. `onMount` runs exactly once, no reactive tracking.
// Same anti-pattern as the ProjectSwitcher 1300+ refresh() loop.
onMount(() => {
	void ollamaSidecarState.loadStatus();
	void ollamaSidecarState.loadConfig();
	void ollamaSidecarState.loadHealth();
});

// ── Debug: refresh-all probe ──────────────────────────────
let debugRefreshing = $state(false);
async function refreshAllProbes(): Promise<void> {
	debugRefreshing = true;
	try {
		await Promise.all([
			ollamaSidecarState.loadStatus(),
			ollamaSidecarState.loadHealth(),
			ollamaSidecarState.loadConfig(),
			ollamaSidecarState.running ? ollamaSidecarState.loadModels() : Promise.resolve(),
		]);
	} finally {
		debugRefreshing = false;
	}
}

// ── Capture (Copy / Export) for the shell header ──────────
function captureFor(tabId: string): CapturePayload | undefined {
	if (tabId === "config" && ollamaSidecarState.config) {
		return {
			filename: "ollama-config.json",
			mime: "application/json",
			content: JSON.stringify(ollamaSidecarState.config, null, 2),
		};
	}
	if (tabId === "debug") {
		const snapshot = {
			status: ollamaSidecarState.status,
			health: ollamaSidecarState.health,
			config: ollamaSidecarState.config,
			running: ollamaSidecarState.running,
			managed: ollamaSidecarState.managed,
			baseUrl: ollamaSidecarState.baseUrl,
			models: ollamaSidecarState.models,
		};
		return {
			filename: "ollama-debug-snapshot.json",
			mime: "application/json",
			content: JSON.stringify(snapshot, null, 2),
		};
	}
	return undefined;
}

// Poll models once the service is running.
$effect(() => {
	if (ollamaSidecarState.running && ollamaSidecarState.models.length === 0) {
		void ollamaSidecarState.loadModels();
	}
});

// ── Derived badge for the shell header ────────────────────
const badge = $derived<HealthBadge>(
	ollamaSidecarState.healthLoading
		? { state: "starting", label: "Checking…" }
		: ollamaSidecarState.health
			? ollamaSidecarState.health.state === "up"
				? { state: "up", label: ollamaSidecarState.health.label }
				: ollamaSidecarState.health.state === "stopped"
					? { state: "stopped", label: ollamaSidecarState.health.label }
					: ollamaSidecarState.health.state === "down"
						? { state: "down", label: ollamaSidecarState.health.label }
						: { state: "unknown", label: ollamaSidecarState.health.label }
			: { state: "unknown", label: "Not checked yet" },
);

// ── Helpers ───────────────────────────────────────────────
function prettySize(bytes: number): string {
	if (!bytes) return "—";
	if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
	if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
	return `${bytes} B`;
}
</script>

<ServiceDevtoolShell
	title="Ollama"
	description="External Ollama process · HTTP API"
	icon={Boxes}
	axis="runtimes"
	accent="salmon"
	health={badge}
	capture={captureFor}
>
	<!-- ── STATUS ─────────────────────────────────────────── -->
	{#snippet status()}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">Runtime Status</Text>
				<Button
					preset="ghost"
					size="sm"
					onclick={() => {
						void ollamaSidecarState.loadStatus();
						void ollamaSidecarState.loadHealth();
					}}
					disabled={ollamaSidecarState.healthLoading}
				>
					{#if ollamaSidecarState.healthLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Refresh
				</Button>
			</div>

			{#if ollamaSidecarState.statusError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{ollamaSidecarState.statusError}
				</div>
			{/if}

			{#if ollamaSidecarState.status}
				<div
					class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
				>
					<div class="flex items-center justify-between mb-2">
						<div class="flex items-center gap-2">
							<Boxes size={14} class="text-[var(--color-teal-400)]" />
							<Text size="sm" weight="semibold">ollama</Text>
							{#if ollamaSidecarState.running}
								{#if ollamaSidecarState.managed === true}
									<Badge tone="positive" size="sm">Managed</Badge>
								{:else if ollamaSidecarState.managed === false}
									<Badge tone="neutral" size="sm">Attached</Badge>
								{/if}
							{:else}
								<Badge tone="neutral" size="sm">Stopped</Badge>
							{/if}
						</div>
						<span
							class="inline-block w-2 h-2 rounded-full"
							style="background: {ollamaSidecarState.running
								? 'var(--signal-success)'
								: 'var(--signal-error)'}"
						></span>
					</div>

					<div class="space-y-1 text-xs">
						{#if ollamaSidecarState.running}
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">Base URL</span>
								<span class="font-mono">{ollamaSidecarState.baseUrl ?? "—"}</span>
							</div>
							{#if ollamaSidecarState.status.version}
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Version</span>
									<span class="font-mono">{ollamaSidecarState.status.version}</span>
								</div>
							{/if}
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">Models</span>
								<span class="font-mono">{ollamaSidecarState.models.length}</span>
							</div>
						{:else}
							<Text size="xs" color="muted">
								Ollama is not running. Click Start to spawn <code>ollama serve</code>
								— or if Ollama is already running on port 11434, Start will attach
								without spawning a second process.
							</Text>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/snippet}

	<!-- ── CONFIG ─────────────────────────────────────────── -->
	{#snippet config()}
		<div class="space-y-3">
			{#if ollamaSidecarState.configError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{ollamaSidecarState.configError}
				</div>
			{/if}

			{#if ollamaSidecarState.config}
				<div class="grid grid-cols-2 gap-2 text-xs">
					<div
						class="p-2 rounded bg-[var(--surface-base)] border border-[var(--border-subtle)]"
					>
						<Text size="xs" color="muted" weight="bold">Enabled</Text>
						<Text size="sm">{ollamaSidecarState.config.enabled ? "Yes" : "No"}</Text>
					</div>
					<div
						class="p-2 rounded bg-[var(--surface-base)] border border-[var(--border-subtle)]"
					>
						<Text size="xs" color="muted" weight="bold">Auto-start</Text>
						<Text size="sm">{ollamaSidecarState.config.auto_start ? "Yes" : "No"}</Text>
					</div>
					<div
						class="p-2 rounded bg-[var(--surface-base)] border border-[var(--border-subtle)]"
					>
						<Text size="xs" color="muted" weight="bold">Host</Text>
						<Text size="sm"><span class="font-mono">{ollamaSidecarState.config.host}</span></Text>
					</div>
					<div
						class="p-2 rounded bg-[var(--surface-base)] border border-[var(--border-subtle)]"
					>
						<Text size="xs" color="muted" weight="bold">Port</Text>
						<Text size="sm"
							><span class="font-mono">{ollamaSidecarState.config.port}</span></Text
						>
					</div>
					<div
						class="p-2 rounded bg-[var(--surface-base)] border border-[var(--border-subtle)] col-span-2"
					>
						<Text size="xs" color="muted" weight="bold">Binary path</Text>
						<Text size="sm">
							<span class="font-mono text-[10px]">
								{ollamaSidecarState.config.binary_path ||
									"(resolve from PATH)"}
							</span>
						</Text>
					</div>
				</div>

				<Text size="xs" color="muted">
					Editable config — host, port, binary path, auto-start — is a
					follow-up. Today these are boot-only from the platform TOML.
				</Text>
			{:else}
				<Text size="sm" color="muted">Loading config…</Text>
			{/if}
		</div>
	{/snippet}

	<!-- ── LOGS ───────────────────────────────────────────── -->
	{#snippet logs()}
		<ScopedLogPanel target="devtools.ollama" />
	{/snippet}

	<!-- ── ACTIONS ────────────────────────────────────────── -->
	{#snippet actions()}
		<div class="space-y-4">
			<!-- Lifecycle -->
			<div class="flex flex-wrap items-center gap-2">
				{#if !ollamaSidecarState.running}
					<Button
						preset="button-primary"
						size="sm"
						onclick={() => void ollamaSidecarState.start()}
						disabled={ollamaSidecarState.starting}
					>
						{#if ollamaSidecarState.starting}
							<Spinner size="xs" />
							Starting…
						{:else}
							<Play size={12} />
							Start
						{/if}
					</Button>
				{:else}
					<Button
						preset="button-ghost"
						size="sm"
						onclick={() => void ollamaSidecarState.stop()}
						disabled={ollamaSidecarState.stopping}
					>
						{#if ollamaSidecarState.stopping}
							<Spinner size="xs" />
							Stopping…
						{:else}
							<PowerOff size={12} />
							Stop
						{/if}
					</Button>
					<Button
						preset="button-secondary"
						size="sm"
						onclick={() => void ollamaSidecarState.restart()}
						disabled={ollamaSidecarState.restarting}
					>
						{#if ollamaSidecarState.restarting}
							<Spinner size="xs" />
							Restarting…
						{:else}
							<RefreshCw size={12} />
							Restart
						{/if}
					</Button>
				{/if}

				{#if ollamaSidecarState.managed === false}
					<Text size="xs" color="muted">
						Attached mode — Stop will not kill the external Ollama.
					</Text>
				{/if}
			</div>

			{#if ollamaSidecarState.actionError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{ollamaSidecarState.actionError}
				</div>
			{/if}

			{#if ollamaSidecarState.running}
				<!-- Pull -->
				<div
					class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] space-y-2"
				>
					<Text size="sm" weight="bold">Pull a model</Text>
					<Text size="xs" color="muted">
						Any tag from <code>ollama.com</code> — for example
						<span class="font-mono">llama3:8b-instruct-q4_K_M</span>.
					</Text>
					<div class="flex gap-2">
						<input
							type="text"
							bind:value={ollamaSidecarState.pullInput}
							placeholder="e.g. llama3:8b-instruct-q4_K_M"
							class="flex-1 rounded px-2 py-1 text-xs outline-none"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
							disabled={ollamaSidecarState.pullingName !== null}
						/>
						<Button
							preset="button-primary"
							size="sm"
							onclick={() => void ollamaSidecarState.pullModel()}
							disabled={ollamaSidecarState.pullingName !== null ||
								!ollamaSidecarState.pullInput.trim()}
						>
							{#if ollamaSidecarState.pullingName}
								<Spinner size="xs" />
								Pulling {ollamaSidecarState.pullingName}…
							{:else}
								<Download size={12} />
								Pull
							{/if}
						</Button>
					</div>
				</div>

				<!-- Models list -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<Text size="sm" weight="semibold">
							Models ({ollamaSidecarState.models.length})
						</Text>
						<Button
							preset="ghost"
							size="sm"
							onclick={() => void ollamaSidecarState.loadModels()}
							disabled={ollamaSidecarState.modelsLoading}
						>
							{#if ollamaSidecarState.modelsLoading}
								<Spinner size="xs" tone="accent" />
							{:else}
								<RefreshCw size={14} />
							{/if}
							Refresh
						</Button>
					</div>

					{#if ollamaSidecarState.modelsError}
						<div
							class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
						>
							{ollamaSidecarState.modelsError}
						</div>
					{/if}

					{#if ollamaSidecarState.models.length > 0}
						<div
							class="rounded-lg border border-[var(--border-subtle)] overflow-hidden"
						>
							<table class="w-full text-xs">
								<thead>
									<tr
										class="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]"
									>
										<th
											class="text-left px-3 py-2 font-medium text-[var(--text-secondary)]"
											>Name</th
										>
										<th
											class="text-right px-3 py-2 font-medium text-[var(--text-secondary)]"
											>Size</th
										>
										<th
											class="text-right px-3 py-2 font-medium text-[var(--text-secondary)]"
											>Modified</th
										>
										<th
											class="px-3 py-2 font-medium text-[var(--text-secondary)]"
										></th>
									</tr>
								</thead>
								<tbody>
									{#each ollamaSidecarState.models as m (m.name)}
										<tr
											class="border-b border-[var(--border-subtle)] hover:bg-[var(--surface-raised)]"
										>
											<td class="px-3 py-2 font-mono">{m.name}</td>
											<td class="px-3 py-2 text-right font-mono"
												>{prettySize(m.size)}</td
											>
											<td
												class="px-3 py-2 text-right font-mono text-[10px] text-[var(--text-secondary)]"
												>{m.modified_at.slice(0, 10) || "—"}</td
											>
											<td class="px-3 py-2 text-right">
												<Button
													preset="ghost"
													size="sm"
													onclick={() =>
														void ollamaSidecarState.deleteModel(m.name)}
													disabled={ollamaSidecarState.deletingName === m.name}
												>
													{#if ollamaSidecarState.deletingName === m.name}
														<Spinner size="xs" />
													{:else}
														<Trash2 size={12} />
													{/if}
												</Button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else if ollamaSidecarState.modelsLoading}
						<Text size="sm" color="muted">Loading models…</Text>
					{:else}
						<Text size="sm" color="muted">
							No models yet. Pull a tag above to get started.
						</Text>
					{/if}
				</div>
			{/if}
		</div>
	{/snippet}

	<!-- ── DEBUG ──────────────────────────────────────────── -->
	{#snippet debug()}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<Text size="sm" weight="semibold">Raw probe snapshot</Text>
					<Text size="xs" color="muted">
						Direct output of the Ollama daemon's HTTP probes — useful when reporting
						a bug or sanity-checking what the platform sees.
					</Text>
				</div>
				<Button preset="ghost" size="sm" onclick={refreshAllProbes} disabled={debugRefreshing}>
					{#if debugRefreshing}
						<Spinner size="xs" tone="accent" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Refresh all
				</Button>
			</div>

			<div class="space-y-3">
				<div class="space-y-1">
					<Text size="xs" color="muted" weight="bold">
						Status — <span class="font-mono">GET /api/version + state</span>
					</Text>
					<pre
						class="text-[10px] font-mono p-2 rounded overflow-x-auto max-h-48"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);">{ollamaSidecarState.status
							? JSON.stringify(ollamaSidecarState.status, null, 2)
							: "(no status loaded)"}</pre>
				</div>

				<div class="space-y-1">
					<Text size="xs" color="muted" weight="bold">
						Health — <span class="font-mono">probe + last error</span>
					</Text>
					<pre
						class="text-[10px] font-mono p-2 rounded overflow-x-auto max-h-32"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);">{ollamaSidecarState.health
							? JSON.stringify(ollamaSidecarState.health, null, 2)
							: "(no health probe yet)"}</pre>
				</div>

				<div class="space-y-1">
					<Text size="xs" color="muted" weight="bold">
						Config — <span class="font-mono">platform.toml [services.system.ollama]</span>
					</Text>
					<pre
						class="text-[10px] font-mono p-2 rounded overflow-x-auto max-h-32"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);">{ollamaSidecarState.config
							? JSON.stringify(ollamaSidecarState.config, null, 2)
							: "(no config loaded)"}</pre>
				</div>

				<div class="space-y-1">
					<Text size="xs" color="muted" weight="bold">
						Models — <span class="font-mono">GET /api/tags ({ollamaSidecarState.models.length})</span>
					</Text>
					<pre
						class="text-[10px] font-mono p-2 rounded overflow-x-auto max-h-64"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);">{ollamaSidecarState.models.length > 0
							? JSON.stringify(ollamaSidecarState.models, null, 2)
							: ollamaSidecarState.running
								? "(no models pulled yet — use Actions ▸ Pull a model)"
								: "(daemon not running)"}</pre>
				</div>
			</div>

			<Text size="xs" color="muted">
				Use the Copy / Export buttons in the header to dump the full snapshot as
				<span class="font-mono">ollama-debug-snapshot.json</span> for bug reports.
			</Text>
		</div>
	{/snippet}
</ServiceDevtoolShell>
