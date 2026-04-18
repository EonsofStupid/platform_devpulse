<!--
  @file Step-1-SystemCheck.svelte
  Sequential system diagnostics with live checklist.
  Absorbs: HardwareDetectionStep tier detection, SetupWizardOverlay scanning template.
  IPC calls are SEQUENTIAL to avoid Mutex lock contention.
-->
<script lang="ts">
import { AlertTriangle, Check, Cpu, HardDrive, Monitor, Search } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { commands } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { formatMb } from "../../../util/models.types.js";
import { fetchRecommendations, listAllPresets, startHardwareScan } from "../wizard.service.js";
import { wizardState } from "../wizard.state.svelte.js";
import { TIER_TOKENS, type TierDisplay, type TierRole } from "../wizard.types.js";

interface Props {
	onComplete: () => void;
}

let { onComplete }: Props = $props();

interface CheckStep {
	id: string;
	label: string;
	icon: typeof Monitor;
	status: "pending" | "running" | "done" | "error";
	result: string;
}

let steps = $state<CheckStep[]>([
	{ id: "hardware", label: "Detecting hardware", icon: Monitor, status: "pending", result: "" },
	{ id: "tier", label: "Classifying your system", icon: Cpu, status: "pending", result: "" },
	{ id: "presets", label: "Loading model presets", icon: Search, status: "pending", result: "" },
	{ id: "models", label: "Scanning local models", icon: HardDrive, status: "pending", result: "" },
]);

let tierDisplay = $state<TierDisplay | null>(null);
let allDone = $derived(steps.every((s) => s.status === "done"));
let hasError = $derived(steps.some((s) => s.status === "error"));
let running = $state(false);

function updateStep(id: string, update: Partial<CheckStep>): void {
	steps = steps.map((s) => (s.id === id ? { ...s, ...update } : s));
}

async function runChecks(): Promise<void> {
	if (running) return;
	running = true;

	// Reset any errors
	steps = steps.map((s) => ({ ...s, status: "pending", result: "" }));

	console.info("[Step1SystemCheck] Starting sequential checks...");

	// Step 1: Hardware (SEQUENTIAL — no parallel IPC)
	updateStep("hardware", { status: "running" });
	console.info("[Step1SystemCheck] → hardware scan");
	try {
		await startHardwareScan();
		const gpu = hardwareState.gpuName ?? "No GPU detected";
		const vram = hardwareState.metrics?.gpu_vram_total_mb;
		const result = vram ? `${gpu} — ${formatMb(vram)} VRAM` : gpu;
		updateStep("hardware", { status: "done", result });
	} catch (e) {
		updateStep("hardware", { status: "error", result: e instanceof Error ? e.message : String(e) });
		running = false;
		return;
	}

	// Step 2: Tier detection
	updateStep("tier", { status: "running" });
	try {
		const config = await fetchRecommendations();
		if (config) {
			const tierResult = await commands.getTierDisplay();
			if (tierResult.status === "ok") {
				tierDisplay = tierResult.data;
				wizardState.recommendedTier = tierResult.data.name;
				updateStep("tier", {
					status: "done",
					result: `${tierResult.data.name} — ${tierResult.data.description}`,
				});
			} else {
				updateStep("tier", { status: "done", result: config.preset_name ?? "Detected" });
			}
		} else {
			updateStep("tier", { status: "error", result: "Could not determine hardware tier" });
		}
	} catch (e) {
		updateStep("tier", { status: "error", result: e instanceof Error ? e.message : String(e) });
	}

	// Step 3: Presets
	updateStep("presets", { status: "running" });
	try {
		const presets = await listAllPresets();
		updateStep("presets", {
			status: "done",
			result: `${presets.length} hardware presets available`,
		});
	} catch (e) {
		updateStep("presets", { status: "error", result: e instanceof Error ? e.message : String(e) });
	}

	// Step 4: Local models
	updateStep("models", { status: "running" });
	try {
		await modelsState.scan();
		const count = modelsState.models.length;
		updateStep("models", {
			status: "done",
			result: count > 0 ? `${count} models found on disk` : "No local models yet",
		});
	} catch (e) {
		updateStep("models", { status: "error", result: e instanceof Error ? e.message : String(e) });
	}

	running = false;

	// Store results in wizard state
	wizardState.systemCheckResults = steps.map((s) => ({
		label: s.label,
		status: s.status,
		result: s.result,
	}));

	// Auto-advance if all passed
	if (steps.every((s) => s.status === "done")) {
		// Small delay so user sees all green checks
		setTimeout(() => onComplete(), 800);
	}
}

// Start checks on mount
$effect(() => {
	if (!running && steps[0].status === "pending") {
		void runChecks();
	}
});
</script>

<div class="check-step">
	<div class="check-header">
		<img src="/imgs/mascot/clyffy-df-icon-interaction1.png" alt="Clyffy scanning" class="check-mascot" />
		<div class="check-title">
			<Text size="lg" weight="bold">System Check</Text>
			<Text size="sm" class="check-subtitle">Scanning your hardware and preparing model options...</Text>
		</div>
	</div>

	<div class="check-list">
		{#each steps as step (step.id)}
			<div class="check-row" class:done={step.status === "done"} class:error={step.status === "error"}>
				<div class="check-icon">
					{#if step.status === "running"}
						<Spinner size="sm" tone="accent" />
					{:else if step.status === "done"}
						<div class="check-circle done"><Check size={14} /></div>
					{:else if step.status === "error"}
						<div class="check-circle error"><AlertTriangle size={14} /></div>
					{:else}
						<div class="check-circle pending"><step.icon size={14} /></div>
					{/if}
				</div>
				<div class="check-content">
					<Text size="sm" weight="bold">{step.label}</Text>
					{#if step.result}
						<Text size="xs" class="check-result">{step.result}</Text>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if tierDisplay}
		{@const tokens = TIER_TOKENS[tierDisplay.role as TierRole]}
		<div class="tier-badge" style:border-color={tokens?.color ?? "var(--border-default)"}>
			<span class="tier-name" style:color={tokens?.color}>{tierDisplay.name}</span>
			<Text size="xs" class="tier-desc">{tierDisplay.tooltip}</Text>
		</div>
	{/if}

	{#if !hardwareState.hasGpu && steps[0].status === "done"}
		<div class="gpu-warning">
			<AlertTriangle size={16} />
			<Text size="sm">No GPU detected. Models will run on CPU — expect slower performance.</Text>
		</div>
	{/if}

	{#if hasError}
		<div class="check-actions">
			<Button preset="button-secondary" size="sm" onclick={runChecks}>
				Retry Failed Checks
			</Button>
			<Button preset="button-ghost" size="sm" onclick={onComplete}>
				Continue Anyway
			</Button>
		</div>
	{/if}

	<div class="check-actions-secondary">
		<Button preset="button-ghost" size="sm" onclick={onComplete}>
			Configure Manually
		</Button>
		<Button preset="button-ghost" size="sm" onclick={() => wizardState.goTo("complete")}>
			Skip Setup
		</Button>
	</div>
</div>

<style>
	.check-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		width: 100%;
		max-width: 36rem;
		padding: 1rem 0;
	}

	.check-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		text-align: left;
		width: 100%;
	}

	.check-mascot {
		width: 3.5rem;
		height: 3.5rem;
		object-fit: contain;
	}

	.check-title {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.check-subtitle) {
		color: var(--text-secondary);
	}

	.check-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		transition: border-color 300ms ease-out;
	}
	.check-row.done {
		border-color: color-mix(in oklch, var(--signal-success) 40%, transparent);
	}
	.check-row.error {
		border-color: color-mix(in oklch, var(--signal-error) 40%, transparent);
	}

	.check-icon {
		flex-shrink: 0;
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.check-circle {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.check-circle.done {
		background: color-mix(in oklch, var(--signal-success) 20%, transparent);
		color: var(--signal-success);
	}
	.check-circle.error {
		background: color-mix(in oklch, var(--signal-error) 20%, transparent);
		color: var(--signal-error);
	}
	.check-circle.pending {
		background: var(--surface-raised);
		color: var(--text-muted);
	}

	.check-content {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
	}

	:global(.check-result) {
		color: var(--text-muted);
	}

	.tier-badge {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		border-left: 3px solid var(--border-default);
		width: 100%;
		text-align: left;
	}

	:global(.tier-desc) {
		color: var(--text-secondary);
	}

	.gpu-warning {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: color-mix(in oklch, var(--signal-warning) 10%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-warning) 30%, transparent);
		color: var(--signal-warning);
		width: 100%;
	}

	.check-actions {
		display: flex;
		gap: 0.5rem;
	}

	.check-actions-secondary {
		display: flex;
		gap: 0.5rem;
		opacity: 0.7;
	}
</style>
