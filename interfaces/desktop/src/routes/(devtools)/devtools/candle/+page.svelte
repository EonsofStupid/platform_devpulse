<!--
	@file /devtools/candle — Candle runtime devtool
	@route /devtools/candle

	Candle (in-process) inference backend. Wired through the existing
	model-loader commands plus the new Candle-specific config + pool
	restart verbs. Previous Phase 4a harness has been removed.
-->
<script lang="ts">
import { Cpu, PowerOff, RefreshCw } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/index.js";
import type {
	CandleConfig,
	ModelInfo,
	ScopedLogEntry,
	SlotInfo,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

// ── Slots + models ───────────────────────────────────────
let slots = $state<SlotInfo[]>([]);
let models = $state<ModelInfo[]>([]);
let refreshing = $state(false);
let error = $state<string | null>(null);

// ── Config ───────────────────────────────────────────────
let cfg = $state<CandleConfig | null>(null);
let cfgDraft = $state<CandleConfig>({
	context_size: 4096,
	gpu_layers: 4294967295,
	dtype: "auto",
});
let cfgLoading = $state(false);
let cfgSaving = $state(false);
let cfgError = $state<string | null>(null);
const cfgDirty = $derived(
	cfg === null
		? false
		: cfg.context_size !== cfgDraft.context_size ||
				cfg.gpu_layers !== cfgDraft.gpu_layers ||
				cfg.dtype !== cfgDraft.dtype,
);

// ── Pool restart ─────────────────────────────────────────
let restarting = $state(false);
let lastUnloaded = $state<number | null>(null);

// ── Logs ─────────────────────────────────────────────────
let logs = $state<ScopedLogEntry[]>([]);
let logsLoading = $state(false);
let logsError = $state<string | null>(null);

// ── Derived ──────────────────────────────────────────────
const assignedCount = $derived(slots.filter((s) => !!s.assigned_model_id).length);
const totalCount = $derived(slots.length);
const candleSlots = $derived(
	slots.filter((s) => {
		const m = models.find((mm) => mm.id === s.assigned_model_id);
		if (!m) return false;
		const ext = m.filename.toLowerCase();
		return (
			ext.endsWith(".gguf") || ext.endsWith(".safetensors") || m.filename.includes("safetensors")
		);
	}),
);

const badge = $derived<HealthBadge>(
	slots.length === 0
		? { state: "unknown", label: "Slots not loaded" }
		: assignedCount === 0
			? { state: "stopped", label: `0 of ${totalCount} slots assigned` }
			: {
					state: "up",
					label: `${assignedCount} of ${totalCount} slots assigned`,
				},
);

// ── Actions ──────────────────────────────────────────────
async function refresh(): Promise<void> {
	refreshing = true;
	error = null;
	try {
		const [slotsR, modelsR] = await Promise.all([commands.getSlots(), commands.scanModels()]);
		if (slotsR.status === "ok") slots = slotsR.data;
		else error = `getSlots: ${slotsR.error}`;
		if (modelsR.status === "ok") models = modelsR.data;
		else error = error ? `${error}; scanModels: ${modelsR.error}` : `scanModels: ${modelsR.error}`;
	} finally {
		refreshing = false;
	}
}

async function loadCfg(): Promise<void> {
	cfgLoading = true;
	cfgError = null;
	try {
		const r = await commands.candleLoadConfig();
		if (r.status === "error") throw new Error(r.error);
		cfg = r.data;
		cfgDraft = { ...r.data };
	} catch (e) {
		cfgError = e instanceof Error ? e.message : String(e);
	} finally {
		cfgLoading = false;
	}
}

async function saveCfg(): Promise<void> {
	cfgSaving = true;
	cfgError = null;
	try {
		const r = await commands.candleSaveConfig(cfgDraft);
		if (r.status === "error") throw new Error(r.error);
		cfg = r.data;
		cfgDraft = { ...r.data };
	} catch (e) {
		cfgError = e instanceof Error ? e.message : String(e);
	} finally {
		cfgSaving = false;
	}
}

function resetCfg(): void {
	if (cfg) cfgDraft = { ...cfg };
}

async function restartPool(): Promise<void> {
	restarting = true;
	error = null;
	try {
		const r = await commands.candleRestartPool();
		if (r.status === "error") throw new Error(r.error);
		lastUnloaded = r.data;
		await refresh();
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	} finally {
		restarting = false;
	}
}

async function loadLogs(): Promise<void> {
	logsLoading = true;
	logsError = null;
	try {
		const r = await commands.queryScopedLog("devtools.candle", 100);
		if (r.status === "error") throw new Error(r.error);
		logs = r.data;
	} catch (e) {
		logsError = e instanceof Error ? e.message : String(e);
	} finally {
		logsLoading = false;
	}
}

$effect(() => {
	void refresh();
	void loadCfg();
});

// Infinity display for "all layers" sentinel.
function gpuLayersText(v: number): string {
	return v === 4294967295 ? "all" : String(v);
}
</script>

<ServiceDevtoolShell
	title="Candle"
	description="In-process model runtime · GGUF + SafeTensors"
	icon={Cpu}
	axis="runtimes"
	health={badge}
>
	{#snippet status()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="bold">
					{assignedCount} of {totalCount} slots assigned · {candleSlots.length} Candle-compatible
				</Text>
				<Button preset="button-ghost" size="sm" onclick={refresh} disabled={refreshing}>
					<RefreshCw size={12} />
					Refresh
				</Button>
			</div>

			{#if candleSlots.length > 0}
				<div class="space-y-1">
					{#each candleSlots as s (s.id)}
						{@const m = models.find((mm) => mm.id === s.assigned_model_id)}
						<div
							class="flex items-center justify-between rounded px-2 py-1"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
						>
							<div class="flex items-center gap-2">
								<Text size="sm">{s.label}</Text>
								<Badge variant="neutral" size="sm">{s.preferred_device}</Badge>
							</div>
							<Text size="xs" color="muted">{m?.filename ?? "—"}</Text>
						</div>
					{/each}
				</div>
			{:else}
				<Text size="sm" color="muted">
					No Candle-backed slots assigned. Use the Model Loader window to assign a
					GGUF / SafeTensors model to a slot.
				</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-4">
			{#if cfgLoading && !cfg}
				<Text size="sm" color="muted">Loading Candle config…</Text>
			{/if}

			{#if cfgError}
				<div
					class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
				>
					{cfgError}
				</div>
			{/if}

			{#if cfg}
				<div class="space-y-3">
					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">
							Context size · {cfgDraft.context_size} tokens
						</Text>
						<input
							type="range"
							min="512"
							max="131072"
							step="512"
							bind:value={cfgDraft.context_size}
							class="w-full max-w-80"
							style="accent-color: var(--accent-teal-main);"
						/>
						<Text size="xs" color="muted">Clamped to [512, 131,072].</Text>
					</div>

					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">
							GPU offload layers · {gpuLayersText(cfgDraft.gpu_layers)}
						</Text>
						<input
							type="number"
							min="0"
							bind:value={cfgDraft.gpu_layers}
							class="w-40 rounded px-2 py-1 text-xs font-mono outline-none"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
						/>
						<Text size="xs" color="muted">
							0 = CPU only. 4294967295 (u32::MAX) = all layers.
						</Text>
					</div>

					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">Dtype hint</Text>
						<select
							bind:value={cfgDraft.dtype}
							class="rounded px-2 py-1 text-xs outline-none"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
						>
							<option value="auto">auto</option>
							<option value="f32">f32</option>
							<option value="f16">f16</option>
							<option value="bf16">bf16</option>
							<option value="q4">q4</option>
							<option value="q5">q5</option>
							<option value="q8">q8</option>
						</select>
					</div>

					<div class="flex items-center gap-2 pt-2">
						<Button
							preset="button-primary"
							size="sm"
							onclick={saveCfg}
							disabled={cfgSaving || !cfgDirty}
						>
							{#if cfgSaving}
								<Spinner size="xs" />
								Saving…
							{:else}
								Save
							{/if}
						</Button>
						<Button
							preset="button-ghost"
							size="sm"
							onclick={resetCfg}
							disabled={!cfgDirty || cfgSaving}
						>
							Discard
						</Button>
						{#if cfgDirty}
							<Text size="xs" color="muted">Unsaved changes</Text>
						{/if}
					</div>

					<Text size="xs" color="muted">
						Persisted in <span class="font-mono text-[10px]">user/candle.toml</span>.
						Applied at next slot-load — restart the pool to force-reload currently
						loaded slots.
					</Text>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet logs()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">
					Scoped log — <span class="font-mono text-xs">devtools.candle</span>
				</Text>
				<Button preset="ghost" size="sm" onclick={loadLogs} disabled={logsLoading}>
					{#if logsLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						Refresh
					{/if}
				</Button>
			</div>

			{#if logsError}
				<div
					class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
				>
					{logsError}
				</div>
			{/if}

			{#if logs.length > 0}
				<div
					class="rounded-lg border border-[var(--border-subtle)] overflow-hidden max-h-80 overflow-y-auto"
				>
					<table class="w-full text-xs">
						<thead class="sticky top-0 bg-[var(--surface-raised)]">
							<tr class="border-b border-[var(--border-subtle)]">
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Time</th>
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Level</th>
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Message</th>
							</tr>
						</thead>
						<tbody>
							{#each logs as line (line.timestamp + line.message)}
								<tr class="border-b border-[var(--border-subtle)]">
									<td class="px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)]"
										>{line.timestamp.slice(11, 19)}</td
									>
									<td class="px-2 py-1 font-mono text-[10px]">{line.level}</td>
									<td class="px-2 py-1 break-all">{line.message}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else if logsLoading}
				<Text size="sm" color="muted">Loading…</Text>
			{:else}
				<Text size="sm" color="muted">
					No entries — click Refresh to tail the current session log.
				</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet actions()}
		<div class="space-y-4">
			<div class="space-y-2">
				<Text size="sm" weight="bold">Restart backend pool</Text>
				<Text size="xs" color="muted">
					Unloads every loaded slot (Candle, llama.cpp-embedded, ORT voice).
					Useful after changing config or pulling a fresh model.
				</Text>
				<div class="flex items-center gap-2">
					<Button
						preset="button-primary"
						size="sm"
						onclick={restartPool}
						disabled={restarting}
					>
						{#if restarting}
							<Spinner size="xs" />
							Restarting…
						{:else}
							<PowerOff size={12} />
							Unload all slots
						{/if}
					</Button>
					{#if lastUnloaded !== null}
						<Text size="xs" color="muted">
							Last run unloaded {lastUnloaded} slot{lastUnloaded === 1 ? "" : "s"}.
						</Text>
					{/if}
				</div>
			</div>

			{#if error}
				<div
					class="p-3 rounded-lg text-sm"
					style="background: var(--signal-error-subtle, #3b1a1a); border: 1px solid var(--signal-error); color: var(--text-primary); max-width: 30rem;"
				>
					{error}
				</div>
			{/if}
		</div>
	{/snippet}
</ServiceDevtoolShell>
