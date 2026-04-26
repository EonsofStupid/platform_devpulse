<!--
	@file /devtools/vision — SigLIP2 vision encoder devtool
	@route /devtools/vision

	Golden-pattern devtool — composes shipped ColdLight primitives only
	(Stat / EmptyState / Callout / Card preset="glass" / Tabs / Tooltip)
	via the _shared/ adapters. Backdrop registered in
	SERVICE_BACKDROPS["vision"] → neural-pulse @ strong intensity, the
	"thinking feeling" for AI capability surfaces.

	Wraps the real SigLIP2 backend at
	`kernel/model-loader/src/backends/candle/siglip.rs` (load/unload +
	encode_image producing an L2-normalized 1152-dim embedding for the
	SO400M default). Slot id is `vision.embedder`.
-->
<script lang="ts">
import { Eye, FileImage, ImageOff, Play, PowerOff } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Callout } from "$lib/design/components/callout/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { EmptyState } from "$lib/design/components/empty-state/index.js";
import { LoadingBlock, Spinner } from "$lib/design/components/spinner/index.js";
import { Stat } from "$lib/design/components/stat/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import { isInferenceReady, modelsState } from "$lib/domains/app/models/index.js";
import {
	CommandErrorAlert,
	DevtoolBentoGrid,
	DevtoolLogsTab,
	type HealthBadge,
	type LogTargetPreset,
	ServiceDevtoolShell,
} from "$lib/domains/platform/_shared/index.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logInfo } from "$lib/sys/logger.js";

const SLOT_ID = "vision.embedder";

const LOG_TARGETS: LogTargetPreset[] = [
	{ value: "devtools.vision", label: "Devtool UI" },
	{ value: "model_loader", label: "Model loader" },
	{ value: "", label: "All targets" },
];

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
let lastError = $state<string | null>(null);

// ── Derived slot state ─────────────────────────────────
const visionStatus = $derived(modelsState.statuses[SLOT_ID]);
const visionReady = $derived(visionStatus ? isInferenceReady(visionStatus) : false);
const visionSlot = $derived(modelsState.slots.find((s) => s.id === SLOT_ID));
const assignedModel = $derived(
	visionSlot?.assigned_model_id
		? modelsState.models.find((m) => m.id === visionSlot.assigned_model_id)
		: undefined,
);

const slotStateLabel = $derived(
	visionReady ? "Ready" : visionSlot?.assigned_model_id ? "Assigned" : "Empty",
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
	lastError = null;
	logInfo("devtools.vision", "Loading vision.embedder slot");
	try {
		await modelsState.load(SLOT_ID);
		logInfo("devtools.vision", "vision.embedder loaded");
	} catch (e) {
		lastError = e instanceof Error ? e.message : String(e);
		logInfo("devtools.vision", `vision.embedder load failed: ${lastError}`);
	} finally {
		loadingSlot = false;
	}
}

async function unloadVision(): Promise<void> {
	loadingSlot = true;
	lastError = null;
	logInfo("devtools.vision", "Unloading vision.embedder slot");
	try {
		await modelsState.unload(SLOT_ID);
		lastResult = null;
		logInfo("devtools.vision", "vision.embedder unloaded");
	} catch (e) {
		lastError = e instanceof Error ? e.message : String(e);
		logInfo("devtools.vision", `vision.embedder unload failed: ${lastError}`);
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
		lastError = "Could not resolve file path — Tauri drag-drop exposes `path` on the File object.";
		input.value = "";
		return;
	}

	encoding = true;
	lastError = null;
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
			lastError = typeof result.error === "string" ? result.error : JSON.stringify(result.error);
			logInfo("devtools.vision", `encode_image failed: ${lastError}`);
		}
	} catch (e) {
		lastError = e instanceof Error ? e.message : String(e);
		logInfo("devtools.vision", `encode_image threw: ${lastError}`);
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
	backdrop="vision"
	health={badge}
>
	{#snippet status()}
		<div class="flex flex-col gap-[var(--space-4)]">
			<Callout variant="tip">
				<div class="p-[var(--space-3)]">
					<Text size="xs" color="muted">
						SigLIP2-SO400M produces 1152-dim image embeddings at 384×384.
						Pipeline: image → resize → normalize (mean 0.5, std 0.5) → CHW
						tensor → VisionModel.forward → pooled embedding → L2 normalize.
					</Text>
				</div>
			</Callout>

			<DevtoolBentoGrid columns={4}>
				<Tooltip>
					<TooltipTrigger>
						<Stat
							label="Slot state"
							value={slotStateLabel}
							accent={visionReady ? "cyber" : visionSlot?.assigned_model_id ? "ember" : "frost"}
							glow={visionReady}
						/>
					</TooltipTrigger>
					<TooltipContent>
						<Text size="xs">
							{visionReady
								? "Weights are in RAM/VRAM and the encoder is ready to forward."
								: visionSlot?.assigned_model_id
									? "Model is assigned to this slot but weights are not yet loaded. Use the Actions tab."
									: "No model assigned to vision.embedder. Use the setup wizard first."}
						</Text>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<Stat label="Embedding dim" value="1152" accent="purple" glow={visionReady} />
					</TooltipTrigger>
					<TooltipContent>
						<Text size="xs">
							SigLIP2-SO400M output dimension. Read from the model's
							config.json at load time.
						</Text>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<Stat label="Image size" value="384" unit="²" accent="teal" />
					</TooltipTrigger>
					<TooltipContent>
						<Text size="xs">Square input resolution. Inputs are resized via CatmullRom.</Text>
					</TooltipContent>
				</Tooltip>

				{#if lastResult}
					<Tooltip>
						<TooltipTrigger>
							<Stat
								label="Last encode"
								value={lastResult.time_ms}
								unit="ms"
								accent="ember"
								glow
							/>
						</TooltipTrigger>
						<TooltipContent>
							<Text size="xs">
								{lastResult.filename} · L2 norm {lastResult.norm.toFixed(4)}
							</Text>
						</TooltipContent>
					</Tooltip>
				{:else}
					<Stat label="Last encode" value="—" accent="frost" />
				{/if}
			</DevtoolBentoGrid>

			{#if assignedModel}
				<Card preset="glass">
					<div
						class="p-[var(--space-3)] flex flex-col gap-[var(--space-2)]"
						style="border-left: var(--border-width-thin) solid var(--accent-purple-main);"
					>
						<div class="flex items-center gap-[var(--space-2)]">
							<Text size="xs" weight="bold">Assigned model</Text>
							{#if visionReady}
								<Badge variant="positive" size="sm">Loaded</Badge>
							{:else}
								<Badge variant="neutral" size="sm">Not loaded</Badge>
							{/if}
						</div>
						<Text size="xs" color="muted">
							ID: <span class="font-mono">{assignedModel.id}</span>
						</Text>
						<Text size="xs" color="muted">
							File: <span class="font-mono break-all">{assignedModel.filename}</span>
						</Text>
					</div>
				</Card>
			{:else}
				<EmptyState>
					<div class="flex flex-col items-center gap-[var(--space-2)]">
						<ImageOff size={28} style="color: var(--text-muted);" />
						<Text size="sm" weight="semibold">No SigLIP2 model assigned</Text>
						<Text size="xs" color="muted">
							Use the setup wizard's Vision card to pick a SigLIP2 build.
							Recommended default:
							<span class="font-mono">google/siglip2-so400m-patch14-384</span>.
						</Text>
					</div>
				</EmptyState>
			{/if}

			{#if lastResult}
				<Card preset="glass">
					<div
						class="p-[var(--space-3)] flex flex-col gap-[var(--space-2)]"
						style="border-left: var(--border-width-thin) solid var(--accent-teal-main);"
					>
						<Text size="xs" weight="bold">Last encoded image</Text>
						<Text size="xs" color="muted">
							{lastResult.filename} · dim {lastResult.dim} · L2 norm
							{lastResult.norm.toFixed(4)} · {lastResult.time_ms} ms
						</Text>
						<Text size="xs" color="muted">
							First 8 dims:
							<span class="font-mono break-all">
								[{lastResult.first8.map((v) => v.toFixed(4)).join(", ")}]
							</span>
						</Text>
					</div>
				</Card>
			{/if}

			<CommandErrorAlert error={lastError} dismissible onDismiss={() => (lastError = null)} />
		</div>
	{/snippet}

	{#snippet config()}
		<div class="flex flex-col gap-[var(--space-4)]">
			<Callout variant="info">
				<div class="p-[var(--space-3)]">
					<Text size="xs" color="muted">
						SigLIP2 runs CPU by default. When compiled with the
						<span class="font-mono">cuda</span> feature, the backend
						auto-selects the first GPU and falls back to CPU if CUDA init
						fails. Image size and embedding dim are read from the model's own
						<span class="font-mono">config.json</span> at load time — they
						reflect the weights on disk, not a config knob.
					</Text>
				</div>
			</Callout>

			<Card preset="glass">
				<div class="p-[var(--space-3)] flex flex-col gap-[var(--space-2)]">
					<Text size="xs" weight="bold">Default expectations (SigLIP2-SO400M-384)</Text>
					<Text size="xs" color="muted">Input resolution: 384 × 384 RGB</Text>
					<Text size="xs" color="muted">Embedding dim: 1152</Text>
					<Text size="xs" color="muted">Normalization: mean 0.5 / std 0.5 (ImageNet-SigLIP)</Text>
					<Text size="xs" color="muted">Output: L2-normalized dense vector</Text>
				</div>
			</Card>

			<Callout variant="warning">
				<div class="p-[var(--space-3)]">
					<Text size="xs" color="muted">
						TODO(reality-gap 2026-04-21): live device override (force CPU even
						when CUDA is available) arrives when
						<span class="font-mono">vision_save_config</span> lands. For now,
						change the compile feature set or rely on the automatic fallback.
					</Text>
				</div>
			</Callout>
		</div>
	{/snippet}

	{#snippet logs()}
		<DevtoolLogsTab targetPresets={LOG_TARGETS} />
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
			<div class="flex flex-col gap-[var(--space-4)]">
				<Card preset="glass">
					<div
						class="p-[var(--space-3)] flex flex-col gap-[var(--space-2)]"
						style="border-left: var(--border-width-thin) solid var(--accent-salmon-main);"
					>
						<Text size="sm" weight="bold">Slot lifecycle</Text>
						<Text size="xs" color="muted">
							Load brings weights into memory. Unload frees them and clears
							the last result.
						</Text>
						<div class="flex flex-wrap items-center gap-[var(--space-2)]">
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
					</div>
				</Card>

				{#if visionReady}
					<Card preset="glass">
						<div
							class="p-[var(--space-3)] flex flex-col gap-[var(--space-2)]"
							style="border-left: var(--border-width-thin) solid var(--accent-teal-main);"
						>
							<Text size="sm" weight="bold">Encode test image</Text>
							<Text size="xs" color="muted">
								Pick any PNG / JPEG — the backend resizes, normalizes, runs
								the forward pass, and returns a 1152-dim L2-normalized vector.
							</Text>
							<Tooltip>
								<TooltipTrigger>
									<label class="cursor-pointer w-fit">
										<input
											type="file"
											accept="image/*"
											class="hidden"
											onchange={handleEncodeFile}
											disabled={encoding}
										/>
										<span
											class="inline-flex items-center gap-[var(--space-1)] px-[var(--space-3)] py-[var(--space-1)] rounded-md text-xs"
											style={encoding
												? "background: var(--surface-raised); color: var(--text-muted); border: var(--border-width-hairline) solid var(--border-subtle); opacity: 0.6; pointer-events: none;"
												: "background: var(--accent-teal-fill); color: var(--accent-teal-main); border: var(--border-width-hairline) solid var(--accent-teal-main);"}
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
								</TooltipTrigger>
								<TooltipContent>
									<Text size="xs">
										Calls commands.encodeImage(slot_id, path). Returns the full
										1152-dim vector; preview shows first 8 dims + L2 norm + timing.
									</Text>
								</TooltipContent>
							</Tooltip>
						</div>
					</Card>
				{:else}
					<EmptyState>
						<div class="flex flex-col items-center gap-[var(--space-2)]">
							<FileImage size={28} style="color: var(--text-muted);" />
							<Text size="sm" weight="semibold">Encode test unavailable</Text>
							<Text size="xs" color="muted">
								Load SigLIP2 to unlock the encode-test affordance.
							</Text>
						</div>
					</EmptyState>
				{/if}
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>
