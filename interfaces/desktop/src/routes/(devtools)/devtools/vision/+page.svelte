<!--
	@file /devtools/vision — SigLIP2 vision encoder devtool
	@route /devtools/vision

	Wraps the real SigLIP2 backend at
	`kernel/model-loader/src/backends/candle/siglip.rs` (load/unload +
	encode_image producing an L2-normalized 1152-dim embedding for the
	SO400M default). Slot id is `vision.embedder`.

	Status  — slot state, embedding_dim, image_size, assigned model.
	Config  — TODO(reality-gap) device + dtype override. Preconfigured
	          CPU today; CUDA auto-selects when compiled with the cuda
	          feature.
	Logs    — TODO(reality-gap) scoped log tail filtered by
	          component=SigLIP Vision.
	Actions — Load / Unload slot (Clyffy spinner), "Encode test image"
	          file picker → calls encode_image(slot_id, path) → shows
	          norm + first-8-dim + timing.
-->
<script lang="ts">
import { Check, Eye, FileImage, Play, PowerOff } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { LoadingBlock, Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { isInferenceReady, modelsState } from "$lib/domains/app/models/index.js";
import {
	type HealthBadge,
	ScopedLogPanel,
	ServiceDevtoolShell,
} from "$lib/domains/platform/_shared/index.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logInfo } from "$lib/sys/logger.js";

const SLOT_ID = "vision.embedder";

// ── State ──────────────────────────────────────────────
let loadingSlot = $state(false);
let encoding = $state(false);
let lastResult = $state<{
	filename: string;
	dim: number;
	norm: number;
	first8: number[];
	time_ms: number;
} | null>(null);
let error = $state<string | null>(null);

// ── Derived slot state ─────────────────────────────────
const visionStatus = $derived(modelsState.statuses[SLOT_ID]);
const visionReady = $derived(visionStatus ? isInferenceReady(visionStatus) : false);
const visionSlot = $derived(modelsState.slots.find((s) => s.id === SLOT_ID));
const assignedModel = $derived(
	visionSlot?.assigned_model_id
		? modelsState.models.find((m) => m.id === visionSlot.assigned_model_id)
		: undefined,
);

const badge = $derived<HealthBadge>(
	visionReady
		? { state: "up", label: "SigLIP2 loaded" }
		: visionSlot?.assigned_model_id
			? { state: "stopped", label: "Model assigned — not loaded" }
			: { state: "unknown", label: "No model assigned" },
);

// ── Slot actions ───────────────────────────────────────
async function loadVision(): Promise<void> {
	loadingSlot = true;
	error = null;
	logInfo("devtools.vision", "Loading vision.embedder slot");
	try {
		await modelsState.load(SLOT_ID);
		logInfo("devtools.vision", "vision.embedder loaded");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.vision", `vision.embedder load failed: ${error}`);
	} finally {
		loadingSlot = false;
	}
}

async function unloadVision(): Promise<void> {
	loadingSlot = true;
	error = null;
	logInfo("devtools.vision", "Unloading vision.embedder slot");
	try {
		await modelsState.unload(SLOT_ID);
		lastResult = null;
		logInfo("devtools.vision", "vision.embedder unloaded");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.vision", `vision.embedder unload failed: ${error}`);
	} finally {
		loadingSlot = false;
	}
}

// ── Encode test image ──────────────────────────────────
async function handleEncodeFile(event: Event): Promise<void> {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	const path = (file as unknown as { path?: string }).path;
	if (!path) {
		error = "Could not resolve file path — Tauri drag-drop exposes `path` on the File object.";
		input.value = "";
		return;
	}

	encoding = true;
	error = null;
	logInfo("devtools.vision", `encode_image — file=${file.name}`);

	const start = performance.now();
	try {
		const result = await commands.encodeImage(SLOT_ID, path);
		const time_ms = Math.round(performance.now() - start);
		if (result.status === "ok") {
			const embedding = result.data;
			const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
			lastResult = {
				filename: file.name,
				dim: embedding.length,
				norm,
				first8: embedding.slice(0, 8),
				time_ms,
			};
			logInfo(
				"devtools.vision",
				`encode_image ok — dim=${embedding.length} norm=${norm.toFixed(4)} time=${time_ms}ms`,
			);
		} else {
			error = typeof result.error === "string" ? result.error : JSON.stringify(result.error);
			logInfo("devtools.vision", `encode_image failed: ${error}`);
		}
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.vision", `encode_image threw: ${error}`);
	} finally {
		encoding = false;
		input.value = "";
	}
}
</script>

<ServiceDevtoolShell
	title="Vision (SigLIP2)"
	description="Image embeddings — preconfigured CPU"
	icon={Eye}
	axis="capabilities"
	accent="salmon"
	health={badge}
>
	{#snippet status()}
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-3">
				<Text size="sm" weight="bold">{SLOT_ID}</Text>
				{#if visionReady}
					<Badge tone="positive" size="sm">
						<Check size={8} />
						Ready
					</Badge>
				{:else if visionSlot?.assigned_model_id}
					<Badge tone="neutral" size="sm">Assigned</Badge>
				{:else}
					<Badge tone="neutral" size="sm">Empty</Badge>
				{/if}
			</div>

			{#if assignedModel}
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" weight="bold">Assigned model</Text>
					<Text size="xs" color="muted">
						ID: <span class="font-mono">{assignedModel.id}</span>
					</Text>
					<Text size="xs" color="muted">
						File: <span class="font-mono">{assignedModel.filename}</span>
					</Text>
				</div>
			{:else}
				<Text size="xs" color="muted">
					No model assigned. Use the setup wizard's Vision card to
					pick a SigLIP2 build for this slot. Recommended default:
					<span class="font-mono">google/siglip2-so400m-patch14-384</span>
					(1152-dim embeddings at 384×384 input).
				</Text>
			{/if}

			{#if visionReady}
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" weight="bold">Pipeline</Text>
					<Text size="xs" color="muted">
						image → resize → normalize (mean 0.5, std 0.5) → CHW tensor →
						VisionModel.forward → pooled embedding → L2 normalize
					</Text>
				</div>
			{/if}

			{#if lastResult}
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" weight="bold">Last encoded image</Text>
					<Text size="xs" color="muted">
						{lastResult.filename} · dim {lastResult.dim} · L2 norm {lastResult.norm.toFixed(4)} · {lastResult.time_ms} ms
					</Text>
					<Text size="xs" color="muted">
						First 8 dims:
						<span class="font-mono">
							[{lastResult.first8.map((v) => v.toFixed(4)).join(", ")}]
						</span>
					</Text>
				</div>
			{/if}

			{#if error}
				<div class="rounded-lg p-3" style="background: var(--signal-error-subtle, #3b1a1a); border: 1px solid var(--signal-error);">
					<Text size="xs">{error}</Text>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="flex flex-col gap-3">
			<Text size="sm" color="muted">
				SigLIP2 runs CPU by default. When compiled with the
				<code>cuda</code> feature, the backend auto-selects the first
				GPU and falls back to CPU if CUDA init fails. Image size and
				embedding dim are read from the model's own
				<span class="font-mono text-[10px]">config.json</span> at load
				time — they reflect the weights on disk, not a config knob.
			</Text>

			<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
				<Text size="xs" weight="bold">Default expectations (SigLIP2-SO400M-384)</Text>
				<Text size="xs" color="muted">Input resolution: 384 × 384 RGB</Text>
				<Text size="xs" color="muted">Embedding dim: 1152</Text>
				<Text size="xs" color="muted">Normalization: mean 0.5 / std 0.5 (ImageNet-SigLIP)</Text>
				<Text size="xs" color="muted">Output: L2-normalized dense vector</Text>
			</div>

			<Text size="xs" color="muted">
				TODO(reality-gap 2026-04-21): live device override (force CPU
				even when CUDA is available) arrives when <code>vision_save_config</code>
				lands. For now, change the compile feature set or rely on the
				automatic fallback.
			</Text>
		</div>
	{/snippet}

	{#snippet logs()}
		<ScopedLogPanel target="devtools.vision" />
	{/snippet}

	{#snippet actions()}
		{#if loadingSlot}
			<LoadingBlock
				title="Loading SigLIP2 vision encoder"
				subtitle="Safely loading into RAM / VRAM — sit tight."
				showContent
				contentKind="dyk"
			/>
		{:else}
			<div class="flex flex-col gap-4">
				<!-- Slot load / unload -->
				<div class="flex flex-wrap items-center gap-2">
					{#if !visionReady && visionSlot?.assigned_model_id}
						<Button preset="button-primary" size="sm" onclick={loadVision}>
							<Play size={12} />
							Load SigLIP2
						</Button>
					{/if}
					{#if visionReady}
						<Button preset="button-ghost" size="sm" onclick={unloadVision}>
							<PowerOff size={12} />
							Unload
						</Button>
					{/if}
					{#if !visionSlot?.assigned_model_id}
						<Text size="xs" color="muted">
							Assign a SigLIP2 model in the setup wizard first.
						</Text>
					{/if}
				</div>

				{#if visionReady}
					<!-- Encode test image -->
					<div class="flex flex-col gap-2">
						<Text size="sm" weight="bold">Encode test image</Text>
						<Text size="xs" color="muted">
							Pick any PNG / JPEG — the backend resizes,
							normalizes, runs the forward pass, and returns a
							1152-dim L2-normalized vector.
						</Text>
						<label class="cursor-pointer">
							<input
								type="file"
								accept="image/*"
								class="hidden"
								onchange={handleEncodeFile}
								disabled={encoding}
							/>
							<span
								class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border"
								style={encoding
									? "background: var(--surface-raised); color: var(--text-muted); border-color: var(--border-subtle); opacity: 0.6; pointer-events: none;"
									: "background: var(--accent-teal-fill); color: var(--accent-teal-main); border-color: var(--accent-teal-main);"}
							>
								{#if encoding}
									<Spinner size="xs" />
									Encoding…
								{:else}
									<FileImage size={14} />
									Pick image → encode
								{/if}
							</span>
						</label>
					</div>
				{:else}
					<Text size="sm" color="muted">
						Load SigLIP2 to unlock the Encode test image control.
					</Text>
				{/if}
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>
