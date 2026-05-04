<!--
	@file VisionDevtool.svelte
	@module @devpulse/devtools/clyffy/eyes/vision
	@route /devtools/clyffy/eyes/vision

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
import { Check, Clipboard, Eye, FileImage, ImageOff, Play, PowerOff } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Callout } from "$lib/design/components/callout/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { EmptyState } from "$lib/design/components/empty-state/index.js";
import { LoadingBlock, Spinner } from "$lib/design/components/spinner/index.js";
import { Stat } from "$lib/design/components/stat/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import {
	CommandErrorAlert,
	DevtoolBentoGrid,
	DevtoolLogsTab,
	type HealthBadge,
	type LogTargetPreset,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import { modelsState } from "$lib/domains/app/models/index.js";
import { capabilityChannel } from "$lib/sys/events/index.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logInfo } from "$lib/sys/logger.js";

const SLOT_ID = "vision.embedder";

/**
 * Layman-friendly name for a registered model. Strips the file extension
 * and any quant suffix from the filename and title-cases the rest, so
 * `siglip2-so400m-patch14-384.safetensors` becomes "Siglip2 So400M Patch14 384".
 * Falls back to the architecture or the raw filename if nothing prettifies.
 */
function prettifyModelName(filename: string, architecture?: string): string {
	const stem = filename.replace(/\.(safetensors|gguf|bin|onnx|pt|pth)$/i, "");
	const cleaned = stem.replace(/[._]/g, "-").replace(/-q\d+(_[a-z0-9]+)?$/i, "");
	const parts = cleaned
		.split("-")
		.filter(Boolean)
		.map((segment) =>
			/^\d/.test(segment)
				? segment.toUpperCase()
				: segment.charAt(0).toUpperCase() + segment.slice(1),
		);
	if (parts.length === 0) return architecture ?? filename;
	return parts.join(" ");
}

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
	embedding: number[];
	previewUrl: string | null;
	time_ms: number;
} | null>(null);
let lastError = $state<string | null>(null);
let unloadConfirm = $state(false);
let copiedAt = $state<number | null>(null);

// ── Derived slot state ─────────────────────────────────
// Readiness from the engine's capability event channel; slot
// metadata + assigned-model lookup remain on `modelsState` because
// those are the model loader's published surface (not the
// forbidden `statuses` lookup the channel replaces).
const visionChannel = capabilityChannel(SLOT_ID);
const visionReady = $derived(visionChannel.ready);
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
		? { state: "up", label: "Runtime up" }
		: visionSlot?.assigned_model_id
			? { state: "stopped", label: "Model assigned · runtime down" }
			: { state: "unknown", label: "Slot empty · auto-config did not run" },
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
	unloadConfirm = false;
	logInfo("devtools.vision", "Unloading vision.embedder slot");
	try {
		await modelsState.unload(SLOT_ID);
		if (lastResult?.previewUrl) URL.revokeObjectURL(lastResult.previewUrl);
		lastResult = null;
		logInfo("devtools.vision", "vision.embedder unloaded");
	} catch (e) {
		lastError = e instanceof Error ? e.message : String(e);
		logInfo("devtools.vision", `vision.embedder unload failed: ${lastError}`);
	} finally {
		loadingSlot = false;
	}
}

function requestUnload(): void {
	if (unloadConfirm) {
		void unloadVision();
		return;
	}
	unloadConfirm = true;
	setTimeout(() => {
		unloadConfirm = false;
	}, 4000);
}

async function handleCopyEmbedding(): Promise<void> {
	if (!lastResult) return;
	try {
		await navigator.clipboard.writeText(JSON.stringify(lastResult.embedding));
		copiedAt = Date.now();
		setTimeout(() => {
			if (copiedAt !== null && Date.now() - copiedAt >= 1500) copiedAt = null;
		}, 1600);
		logInfo("devtools.vision", `clipboard write ok — ${lastResult.embedding.length} floats`);
	} catch (e) {
		lastError = e instanceof Error ? e.message : String(e);
		logInfo("devtools.vision", `clipboard write failed: ${lastError}`);
	}
}

// ── Encode test image ──────────────────────────────────
async function handleEncodeFile(event: Event): Promise<void> {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	const path = (file as unknown as { path?: string }).path;
	if (!path) {
		lastError =
			"File path missing — Tauri's webkitdirectory/drag-drop did not expose .path. Re-pick the file.";
		input.value = "";
		return;
	}

	encoding = true;
	lastError = null;
	logInfo("devtools.vision", `encode_image — file=${file.name}`);

	if (lastResult?.previewUrl) URL.revokeObjectURL(lastResult.previewUrl);
	const previewUrl = URL.createObjectURL(file);

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
				embedding,
				previewUrl,
				time_ms,
			};
			logInfo(
				"devtools.vision",
				`encode_image ok — dim=${embedding.length} norm=${norm.toFixed(4)} time=${time_ms}ms`,
			);
		} else {
			URL.revokeObjectURL(previewUrl);
			lastError = typeof result.error === "string" ? result.error : JSON.stringify(result.error);
			logInfo("devtools.vision", `encode_image failed: ${lastError}`);
		}
	} catch (e) {
		URL.revokeObjectURL(previewUrl);
		lastError = e instanceof Error ? e.message : String(e);
		logInfo("devtools.vision", `encode_image threw: ${lastError}`);
	} finally {
		encoding = false;
		input.value = "";
	}
}
</script>

<ServiceDevtoolShell
	title="Vision"
	description="Auto-managed image encoder slot · diagnostics + manual probe"
	icon={Eye}
	axis="capabilities"
	accent="salmon"
	backdrop="vision"
	health={badge}
>
	{#snippet status()}
		<div class="flex flex-col gap-[var(--space-4)]">
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
								? "Runtime up. Encode probe ready on the Actions tab."
								: visionSlot?.assigned_model_id
									? "Slot has a model but no live runtime. Hit Load on the Actions tab to bring it up."
									: "Auto-config did not assign a vision model. Check the model_loader log target."}
						</Text>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<Stat label="Embedding dim" value="1152" accent="electric" glow={visionReady} />
					</TooltipTrigger>
					<TooltipContent>
						<Text size="xs">
							SigLIP2-SO400M output dim. L2-normalized, comparable
							across encodes via cosine similarity.
						</Text>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<Stat label="Image size" value="384" unit="²" accent="azure" />
					</TooltipTrigger>
					<TooltipContent>
						<Text size="xs">
							Square input resolution. Inputs are bilinearly resized;
							normalized mean=0.5 std=0.5 (ImageNet-SigLIP).
						</Text>
					</TooltipContent>
				</Tooltip>

				{#if lastResult}
					<Tooltip>
						<TooltipTrigger>
							<Stat
								label="Last encode"
								value={lastResult.time_ms}
								unit="ms"
								accent="gold"
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
						style="border-left: var(--border-width-thin) solid var(--accent-electric-main);"
					>
						<div class="flex items-center gap-[var(--space-2)] flex-wrap">
							<Text size="sm" weight="bold">
								{prettifyModelName(assignedModel.filename, assignedModel.architecture)}
							</Text>
							{#if visionReady}
								<Badge variant="positive" size="sm">Loaded</Badge>
							{:else}
								<Badge variant="neutral" size="sm">Not loaded</Badge>
							{/if}
						</div>
						<Text size="xs" color="muted">
							File: <span class="font-mono break-all">{assignedModel.filename}</span>
						</Text>
						<Text size="xs" color="muted">
							ID: <span class="font-mono break-all">{assignedModel.id}</span>
						</Text>
					</div>
				</Card>
			{:else}
				<EmptyState>
					<div class="flex flex-col items-center gap-[var(--space-2)] text-center">
						<ImageOff size={28} style="color: var(--text-muted);" />
						<Text size="sm" weight="semibold">Auto-config did not assign a vision model</Text>
						<Text size="xs" color="muted">
							The model loader runs at boot and auto-picks a SigLIP2 build for
							<span class="font-mono">vision.embedder</span>. If this slot is
							empty, check the
							<span class="font-mono">model_loader</span> log target on the Logs
							tab — auto-config failed or no compatible model is registered.
						</Text>
					</div>
				</EmptyState>
			{/if}

			{#if lastResult}
				<Card preset="glass">
					<div
						class="p-[var(--space-3)] flex gap-[var(--space-3)]"
						style="border-left: var(--border-width-thin) solid var(--accent-teal-main);"
					>
						{#if lastResult.previewUrl}
							<img
								src={lastResult.previewUrl}
								alt={lastResult.filename}
								class="rounded-md object-cover flex-shrink-0"
								style="width: 4.5rem; height: 4.5rem; border: var(--border-width-hairline) solid var(--border-subtle);"
							/>
						{/if}
						<div class="flex flex-col gap-[var(--space-2)] min-w-0 flex-1">
							<div class="flex items-center justify-between gap-[var(--space-2)]">
								<Text size="xs" weight="bold">Last encode probe</Text>
								<Tooltip>
									<TooltipTrigger>
										<button
											type="button"
											onclick={handleCopyEmbedding}
											class="inline-flex items-center gap-[var(--space-1)] px-[var(--space-2)] py-[var(--space-1)] rounded-md text-xs"
											style={copiedAt
												? "background: var(--accent-cyber-fill); color: var(--accent-cyber-main); border: var(--border-width-hairline) solid var(--accent-cyber-main);"
												: "background: var(--surface-raised); color: var(--text-muted); border: var(--border-width-hairline) solid var(--border-subtle);"}
										>
											{#if copiedAt}
												<Check size={12} />
												Copied
											{:else}
												<Clipboard size={12} />
												Copy fingerprint
											{/if}
										</button>
									</TooltipTrigger>
									<TooltipContent>
										<Text size="xs">
											Copies the full {lastResult.dim}-dim vector as a JSON
											array. Useful for diffing against a known-good encode.
										</Text>
									</TooltipContent>
								</Tooltip>
							</div>
							<Text size="xs" color="muted">
								<span class="font-mono break-all">{lastResult.filename}</span>
								· {lastResult.time_ms} ms · {lastResult.dim} numbers
							</Text>
							<Text size="xs" color="muted">
								Preview (first 8 of {lastResult.dim}):
								<span class="font-mono break-all">
									[{lastResult.first8.map((v) => v.toFixed(4)).join(", ")}]
								</span>
							</Text>
						</div>
					</div>
				</Card>
			{/if}

			<CommandErrorAlert error={lastError} dismissible onDismiss={() => (lastError = null)} />
		</div>
	{/snippet}

	{#snippet config()}
		<div class="flex flex-col gap-[var(--space-4)]">
			<Callout variant="info">
				<div class="p-[var(--space-3)] flex flex-col gap-[var(--space-1)]">
					<Text size="xs" weight="bold">Auto-managed slot</Text>
					<Text size="xs" color="muted">
						vision.embedder is picked, downloaded, and loaded by the model
						loader at boot. There are no end-user knobs here. This page is
						the diagnostic surface — read-only state plus a manual probe.
					</Text>
				</div>
			</Callout>

			<Card preset="glass">
				<div class="p-[var(--space-3)] flex flex-col gap-[var(--space-2)]">
					<Text size="xs" weight="bold">Slot reference (SigLIP2-SO400M-384)</Text>
					<Text size="xs" color="muted">Slot id: <span class="font-mono">vision.embedder</span></Text>
					<Text size="xs" color="muted">Backend: candle / siglip.rs</Text>
					<Text size="xs" color="muted">Input: 384 × 384 RGB, mean=0.5 std=0.5</Text>
					<Text size="xs" color="muted">Output: 1152-dim, L2-normalized</Text>
					<Text size="xs" color="muted">Device: CPU default · CUDA when feature-built and reachable</Text>
				</div>
			</Card>
		</div>
	{/snippet}

	{#snippet logs()}
		<DevtoolLogsTab targetPresets={LOG_TARGETS} />
	{/snippet}

	{#snippet actions()}
		{#if loadingSlot}
			<LoadingBlock
				title="Loading vision.embedder"
				subtitle="Pulling weights into memory — usually a few seconds."
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
						<Text size="sm" weight="bold">Manual load · unload</Text>
						<Text size="xs" color="muted">
							The slot loads automatically at boot. These manual controls
							are for re-loading after an unload probe or freeing the slot
							to test cold-start latency.
						</Text>
						<div class="flex flex-wrap items-center gap-[var(--space-2)]">
							{#if !visionReady && visionSlot?.assigned_model_id}
								<Button preset="button-primary" size="sm" onclick={loadVision}>
									<Play size={12} />
									Load
								</Button>
							{/if}
							{#if visionReady}
								<Tooltip>
									<TooltipTrigger>
										<Button preset="button-ghost" size="sm" onclick={requestUnload}>
											<PowerOff size={12} />
											{unloadConfirm ? "Confirm — unload now" : "Unload"}
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<Text size="xs">
											{unloadConfirm
												? "Click again to free the runtime and clear the last probe. Auto-cancels in 4 s."
												: "Frees the runtime and clears the last probe result. Confirms first."}
										</Text>
									</TooltipContent>
								</Tooltip>
							{/if}
							{#if !visionSlot?.assigned_model_id}
								<Text size="xs" color="muted">
									Slot has no assigned model — auto-config never picked one.
									Check the
									<span class="font-mono">model_loader</span> log target.
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
							<Text size="sm" weight="bold">Encode probe</Text>
							<Text size="xs" color="muted">
								Pick a PNG / JPEG to verify the runtime end-to-end. Returns
								the 1152-dim vector with timing and L2 norm — diff against
								a known-good encode to catch regressions.
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
										Calls commands.encodeImage(slot, path). Returns the full
										1152-dim vector; the preview shows the first 8 dims, L2
										norm, and wall-clock time.
									</Text>
								</TooltipContent>
							</Tooltip>
						</div>
					</Card>
				{:else}
					<EmptyState>
						<div class="flex flex-col items-center gap-[var(--space-2)] text-center">
							<FileImage size={28} style="color: var(--text-muted);" />
							<Text size="sm" weight="semibold">Runtime not up — probe disabled</Text>
							<Text size="xs" color="muted">
								Slot is loaded only when the runtime is alive. Hit Load above
								(or wait for auto-load to settle) before picking an image.
							</Text>
						</div>
					</EmptyState>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#snippet debug()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				Power-user probes for the SigLIP2 vision encoder. The slot
				readout below tells you which model variant the system picked
				(HD vs base) and whether it's currently loaded.
			</Text>
			<div class="rounded p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
				<Text size="sm" weight="bold" class="block mb-2">Vision slot</Text>
				<div class="text-xs space-y-1">
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Loaded</span>
						<span class="font-mono">{visionReady ? "yes" : "no"}</span>
					</div>
					{#if visionSlot?.assigned_model_id}
						<div class="flex justify-between gap-2">
							<span style="color: var(--text-secondary)">Model id</span>
							<span class="font-mono text-[10px] truncate">{visionSlot.assigned_model_id}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>
