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
import { Check, Clipboard, Eye, FileImage, ImageOff, Play, PowerOff, Wand2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Callout } from "$lib/design/components/callout/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { EmptyState } from "$lib/design/components/empty-state/index.js";
import { LoadingBlock, Spinner } from "$lib/design/components/spinner/index.js";
import { Stat } from "$lib/design/components/stat/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import { isInferenceReady, modelsState, wizardState } from "$lib/domains/app/models/index.js";
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
		? { state: "up", label: "Ready to encode" }
		: visionSlot?.assigned_model_id
			? { state: "stopped", label: "Model picked — not loaded yet" }
			: { state: "unknown", label: "No model picked yet" },
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

function openWizard(): void {
	logInfo("devtools.vision", "openWizard() — opening setup wizard overlay");
	wizardState.open();
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
			"Couldn't read that file's path. Try drag-and-drop instead, or pick the file again.";
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
	description="Turns images into fingerprints Clyffy can search and compare"
	icon={Eye}
	axis="capabilities"
	accent="salmon"
	backdrop="vision"
	health={badge}
>
	{#snippet status()}
		<div class="flex flex-col gap-[var(--space-4)]">
			<Callout variant="tip">
				<div class="p-[var(--space-3)] flex flex-col gap-[var(--space-1)]">
					<Text size="xs" weight="bold">What this does</Text>
					<Text size="xs" color="muted">
						Turns any picture into a 1152-number "fingerprint" Clyffy
						can use to find or compare similar images. You give it a
						PNG or JPEG; it gives back a vector. Same image in → same
						vector out, every time.
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
								? "Loaded into memory and ready to encode images. Try it on the Actions tab."
								: visionSlot?.assigned_model_id
									? "A model is picked but not loaded yet. Open the Actions tab and click Load."
									: "Nothing picked yet. Open the setup wizard and choose a vision model."}
						</Text>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<Stat label="Embedding dim" value="1152" accent="electric" glow={visionReady} />
					</TooltipTrigger>
					<TooltipContent>
						<Text size="xs">
							Each image becomes a list of 1152 numbers. That list is the
							fingerprint Clyffy compares against other images.
						</Text>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<Stat label="Image size" value="384" unit="²" accent="azure" />
					</TooltipTrigger>
					<TooltipContent>
						<Text size="xs">
							Every image is scaled to a 384 × 384 square before encoding —
							pick any size you like, the model normalizes the rest.
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
						<Text size="sm" weight="semibold">No vision model picked yet</Text>
						<Text size="xs" color="muted">
							Open the setup wizard and pick a vision encoder. The
							recommended default works well on most machines.
						</Text>
						<Button preset="button-primary" size="sm" onclick={openWizard}>
							<Wand2 size={12} />
							Open setup wizard
						</Button>
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
								<Text size="xs" weight="bold">Last image you encoded</Text>
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
											Copies the full {lastResult.dim}-number vector to your
											clipboard as JSON. Paste into a notebook or another tool.
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
					<Text size="xs" weight="bold">Where it runs</Text>
					<Text size="xs" color="muted">
						Runs on your CPU by default. If your build includes GPU
						support and a card is available, it uses the GPU automatically
						and falls back to CPU when the GPU isn't reachable.
					</Text>
				</div>
			</Callout>

			<Card preset="glass">
				<div class="p-[var(--space-3)] flex flex-col gap-[var(--space-2)]">
					<Text size="xs" weight="bold">What this model expects</Text>
					<Text size="xs" color="muted">Image size: 384 × 384 (it resizes for you)</Text>
					<Text size="xs" color="muted">Output: 1152 numbers per image</Text>
					<Text size="xs" color="muted">Color: RGB, normalized internally</Text>
					<Text size="xs" color="muted">
						Comparable across images — cosine similarity tells you how alike two pictures are.
					</Text>
				</div>
			</Card>

			<Callout variant="warning">
				<div class="p-[var(--space-3)] flex flex-col gap-[var(--space-1)]">
					<Text size="xs" weight="bold">Coming soon</Text>
					<Text size="xs" color="muted">
						Forcing CPU even when a GPU is available isn't a setting yet —
						today the model auto-picks the best device. If you need to
						lock it to CPU, swap to a CPU-only build for now.
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
				title="Loading the vision model"
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
						<Text size="sm" weight="bold">Load · Unload</Text>
						<Text size="xs" color="muted">
							Load pulls the vision model into memory so it can encode
							images. Unload frees that memory and clears your last test
							result.
						</Text>
						<div class="flex flex-wrap items-center gap-[var(--space-2)]">
							{#if !visionReady && visionSlot?.assigned_model_id}
								<Button preset="button-primary" size="sm" onclick={loadVision}>
									<Play size={12} />
									Load model
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
												? "Click again to free the model from memory and clear your last test result. Auto-cancels in 4 s."
												: "Frees the model from memory and clears your last test result. Asks for confirmation first."}
										</Text>
									</TooltipContent>
								</Tooltip>
							{/if}
							{#if !visionSlot?.assigned_model_id}
								<Button preset="button-primary" size="sm" onclick={openWizard}>
									<Wand2 size={12} />
									Open setup wizard
								</Button>
								<Text size="xs" color="muted">
									Pick a vision model first.
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
							<Text size="sm" weight="bold">Try it on a real image</Text>
							<Text size="xs" color="muted">
								Pick any PNG or JPEG. Clyffy turns it into the 1152-number
								fingerprint and shows you how long it took plus a peek at the
								result.
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
										Sends your image through the model, returns the 1152-number
										fingerprint, and shows the first 8 numbers plus the time it took.
									</Text>
								</TooltipContent>
							</Tooltip>
						</div>
					</Card>
				{:else}
					<EmptyState>
						<div class="flex flex-col items-center gap-[var(--space-2)] text-center">
							<FileImage size={28} style="color: var(--text-muted);" />
							<Text size="sm" weight="semibold">Load the model first</Text>
							<Text size="xs" color="muted">
								Click "Load model" above. Once it's in memory you can pick
								any image to test the encoder.
							</Text>
						</div>
					</EmptyState>
				{/if}
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>
