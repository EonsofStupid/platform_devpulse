<!--
	@file /devtools/candle — Candle runtime devtool
	@route /devtools/candle

	Candle (in-process) model execution backend. Covers GGUF + SafeTensors
	loading for Qwen3 / Phi-3 and friends. Status + Actions wired against
	the existing model-loader commands (no dedicated `candle_*` commands
	exist; this surface derives from `get_slots` + `scan_models`).
-->
<script lang="ts">
import { Cpu, RefreshCw } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	type HealthBadge,
	ServiceDevtoolShell,
	SwapPrimaryBrainButton,
} from "$lib/domains/platform/index.js";
import type { ModelInfo, SlotInfo } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

// ── State ────────────────────────────────────────────────
let slots = $state<SlotInfo[]>([]);
let models = $state<ModelInfo[]>([]);
let refreshing = $state(false);
let error = $state<string | null>(null);
// Phase 4a harness — delete in Phase 8.
let harnessModelId = $state("");

// ── Derived ──────────────────────────────────────────────
const assignedCount = $derived(slots.filter((s) => !!s.assigned_model_id).length);
const totalCount = $derived(slots.length);
const candleSlots = $derived(
	slots.filter((s) => {
		const m = models.find((mm) => mm.id === s.assigned_model_id);
		if (!m) return false;
		// Heuristic: Candle handles GGUF + safetensors for Qwen3 / Phi-3
		// families. This filter mirrors the backend dispatch in
		// kernel/model-loader/src/backends/candle/backend.rs.
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

$effect(() => {
	void refresh();
});
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
						<div class="flex items-center justify-between rounded px-2 py-1" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
							<div class="flex items-center gap-2">
								<Text size="sm">{s.label}</Text>
								<Badge variant="neutral" size="sm">{s.preferred_device}</Badge>
							</div>
							<Text size="xs" color="muted">
								{m?.filename ?? "\u2014"}
							</Text>
						</div>
					{/each}
				</div>
			{:else}
				<Text size="sm" color="muted">
					No Candle-backed slots assigned. Use the Model Loader window to
					assign a GGUF / SafeTensors model to a slot.
				</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<Text size="sm" color="muted">
			TODO(reality-gap 2026-04-21): Candle runtime config (GPU offload layers,
			context size, KV sizing, dtype) not yet exposed as a dedicated Tauri
			command. Today the configuration lives in slot TOMLs under
			<span class="font-mono text-[10px]">kernel/model-loader/config/slots.default.toml</span>.
			Wires up with <code>candle_save_config</code>.
		</Text>
	{/snippet}

	{#snippet logs()}
		<Text size="sm" color="muted">
			TODO(reality-gap 2026-04-21): Candle-scoped log export not yet wired.
			For now, session logs live at
			<span class="font-mono text-[10px]">.userdata/logs/session-*.jsonl</span>
			— filter by <code>backend=candle</code>. Wires up with
			<code>candle_export_logs</code>.
		</Text>
	{/snippet}

	{#snippet actions()}
		<div class="space-y-4">
			<div class="space-y-2">
				<Text size="sm" color="muted">
					Candle is a library backend inside the engine, not a standalone
					service — lifecycle (start/stop/restart) is the platform's
					responsibility. Per-slot warm / unload happens through the Model
					Loader window. A dedicated "restart Candle backend pool" action
					wires up with <code>candle_restart</code> in a follow-up sprint.
				</Text>
				<div class="flex gap-2 opacity-50">
					<Button preset="default" size="sm" disabled>Restart pool (not wired)</Button>
				</div>
			</div>

			<!--
				Phase 4a harness (SPRINT-DEVTOOLS-FOUNDATIONAL). Delete in
				Phase 8. Tests SwapPrimaryBrainButton end-to-end against a
				real model id typed by the owner. Not production UX — the
				real "Make primary" surface lives on the Phi / Persona
				devtools in Phases 5 + 7.
			-->
			<div class="rounded-lg p-3 flex flex-col gap-2" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
				<Text size="sm" weight="bold">Phase 4a harness — swap primary brain</Text>
				<Text size="xs" color="muted">
					Type a model id from this build's registry and click.
					Runs the full unload → reassign → load through
					<code>swap_slot_model</code>, with the Clyffy LoadingBlock
					overlay + logging. Delete this row in Phase 8.
				</Text>
				<div class="flex items-center gap-2 flex-wrap">
					<input
						type="text"
						bind:value={harnessModelId}
						placeholder="e.g. qwen-qwen3-4b-instruct-q4-k-m"
						class="flex-1 min-w-60 rounded px-2 py-1 text-xs outline-none"
						style="background: var(--surface-raised); border: 1px solid var(--border-subtle); color: var(--text-primary);"
					/>
					<SwapPrimaryBrainButton
						newModelId={harnessModelId}
						label="Make chat.brain this"
						disabled={!harnessModelId.trim()}
					/>
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
