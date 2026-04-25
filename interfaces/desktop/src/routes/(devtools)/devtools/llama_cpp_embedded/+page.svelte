<!--
	@file /devtools/llama_cpp_embedded — In-process GGUF runtime (llama.cpp)
	@route /devtools/llama_cpp_embedded

	Library backend — lifecycle is owned by the backend pool. This
	devtool surfaces user-scope runtime config (context_size, gpu_layers,
	kv_dtype, n_batch) + a live scoped log tail. Model assignment lives
	on the Model Loader window.
-->
<script lang="ts">
import { PackageOpen } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/index.js";
import type { LlamaCppEmbeddedConfig, ScopedLogEntry } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

// ── Config ───────────────────────────────────────────────
let cfg = $state<LlamaCppEmbeddedConfig | null>(null);
let cfgDraft = $state<LlamaCppEmbeddedConfig>({
	context_size: 4096,
	gpu_layers: 4294967295,
	kv_dtype: "f16",
	n_batch: 512,
});
let cfgLoading = $state(false);
let cfgSaving = $state(false);
let cfgError = $state<string | null>(null);
const cfgDirty = $derived(
	cfg === null
		? false
		: cfg.context_size !== cfgDraft.context_size ||
				cfg.gpu_layers !== cfgDraft.gpu_layers ||
				cfg.kv_dtype !== cfgDraft.kv_dtype ||
				cfg.n_batch !== cfgDraft.n_batch,
);

// ── Logs ─────────────────────────────────────────────────
let logs = $state<ScopedLogEntry[]>([]);
let logsLoading = $state(false);
let logsError = $state<string | null>(null);

async function loadCfg(): Promise<void> {
	cfgLoading = true;
	cfgError = null;
	try {
		const r = await commands.llamaCppEmbeddedLoadConfig();
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
		const r = await commands.llamaCppEmbeddedSaveConfig(cfgDraft);
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

async function loadLogs(): Promise<void> {
	logsLoading = true;
	logsError = null;
	try {
		const r = await commands.queryScopedLog("devtools.llama_cpp", 100);
		if (r.status === "error") throw new Error(r.error);
		logs = r.data;
	} catch (e) {
		logsError = e instanceof Error ? e.message : String(e);
	} finally {
		logsLoading = false;
	}
}

$effect(() => {
	void loadCfg();
});

function gpuLayersText(v: number): string {
	return v === 4294967295 ? "all" : String(v);
}

const badge: HealthBadge = {
	state: "up",
	label: "Library backend — active at slot-load time",
};
</script>

<ServiceDevtoolShell
	title="llama.cpp (embedded)"
	description="In-process GGUF runtime via llama-cpp-2"
	icon={PackageOpen}
	axis="runtimes"
	accent="hotpink"
	health={badge}
>
	{#snippet status()}
		<Text size="sm" color="muted">
			llama.cpp-embedded is a library backend (bound via <code>llama-cpp-2</code>),
			not a service — there is no child process to start or stop. When a slot
			is assigned a GGUF model that routes to this backend, the pool loads the
			model in-process using the config below. Use the Model Loader window to
			assign models to slots.
		</Text>
	{/snippet}

	{#snippet config()}
		<div class="space-y-4">
			{#if cfgLoading && !cfg}
				<Text size="sm" color="muted">Loading llama.cpp config…</Text>
			{/if}

			{#if cfgError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
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
					</div>

					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">KV-cache dtype</Text>
						<select
							bind:value={cfgDraft.kv_dtype}
							class="rounded px-2 py-1 text-xs outline-none"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
						>
							<option value="f16">f16 (default)</option>
							<option value="q8_0">q8_0 (half memory)</option>
							<option value="q4_0">q4_0 (quarter memory)</option>
						</select>
					</div>

					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">
							n_batch · {cfgDraft.n_batch} tokens/pass
						</Text>
						<input
							type="range"
							min="1"
							max="4096"
							step="1"
							bind:value={cfgDraft.n_batch}
							class="w-full max-w-80"
							style="accent-color: var(--accent-teal-main);"
						/>
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
						Persisted in
						<span class="font-mono text-[10px]">user/llama_cpp_embedded.toml</span>.
						Applied at next slot-load.
					</Text>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet logs()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">
					Scoped log — <span class="font-mono text-xs">devtools.llama_cpp</span>
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
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{logsError}
				</div>
			{/if}

			{#if logs.length > 0}
				<div class="rounded-lg border border-[var(--border-subtle)] overflow-hidden max-h-80 overflow-y-auto">
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
									<td class="px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)]">{line.timestamp.slice(11, 19)}</td>
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
		<Text size="sm" color="muted">
			No lifecycle verbs — llama.cpp-embedded is library-backed, with per-slot
			load/unload owned by the backend pool. Use the Candle devtool's "Unload
			all slots" to force a pool-wide restart after changing config.
		</Text>
	{/snippet}
</ServiceDevtoolShell>
