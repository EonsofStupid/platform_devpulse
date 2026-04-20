<!--
  @file SystemCheckView.svelte
  @domain models/setup-wizard

  View 2 of the 5-view setup wizard. Absorbs Step1SystemCheck.

  Reads cached hardware state (populated by platform boot) and displays:
  - GPU / CPU / RAM / Disk with pass/warn badges
  - Tier badge (Ultra / High / Jesse Primary / Mid / Floor / Minimal / CPU Only)
  - GPU-missing warning banner
  - "Continue" → Config view, "Skip Setup" → Done view, "Back" → Welcome

  Zero IPC. Everything derives from cached state. No scan triggers.
-->
<script lang="ts">
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Check,
	Cpu,
	HardDrive,
	Monitor,
	Zap,
} from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { logInfo } from "$lib/sys/logger.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { setupWizardOverlayState } from "../../../data-access/setup-wizard-overlay.state.svelte.js";
import { formatMb } from "../../../util/models.types.js";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";

let showTierInfo = $state(false);

const overlayState = setupWizardOverlayState;

const hasHardware = $derived(hardwareState.hasSnapshot);
const hasGpu = $derived(hardwareState.hasGpu);
const gpuName = $derived(hardwareState.gpuName ?? "No GPU detected");
const vramMb = $derived(hardwareState.metrics?.gpu_vram_total_mb ?? 0);
const cpuName = $derived(hardwareState.cpuName ?? "Unknown CPU");
const ramMb = $derived(hardwareState.metrics?.ram_total_mb ?? 0);
const diskFreeMb = $derived(hardwareState.metrics?.disk_free_mb ?? 0);
const modelCount = $derived(modelsState.models.length);

// Tier comes from the kernel via hardwareState — do NOT recompute here.
// Real tier union: "High" | "JessePrimary" | "Mid" | "Floor" | "Minimal" | "CpuOnly"
const tier = $derived(hardwareState.tier);

/** Layman-friendly tier label (matches the kernel enum). */
const tierLabel = $derived(
	tier === "High"
		? "High"
		: tier === "JessePrimary"
			? "Jesse Primary"
			: tier === "Mid"
				? "Mid"
				: tier === "Floor"
					? "Floor"
					: tier === "Minimal"
						? "Minimal"
						: "CPU Only",
);

const tierDescription = $derived(
	tier === "High"
		? "Full model stack. All slots GPU-accelerated."
		: tier === "JessePrimary" || tier === "Mid"
			? "Partial offload. Brain on GPU, helpers on CPU."
			: "CPU-focused. Smaller models recommended.",
);

const tierTone = $derived(
	tier === "High" ? "positive" : tier === "JessePrimary" || tier === "Mid" ? "neutral" : "neutral",
);

interface SpecRow {
	id: string;
	label: string;
	value: string;
	icon: typeof Monitor;
	ok: boolean;
}

const specs = $derived<SpecRow[]>([
	{
		id: "gpu",
		label: "Graphics Card",
		value: vramMb > 0 ? `${gpuName} — ${formatMb(vramMb)} VRAM` : gpuName,
		icon: Monitor,
		ok: hasGpu,
	},
	{
		id: "cpu",
		label: "Processor",
		value: cpuName,
		icon: Cpu,
		ok: true,
	},
	{
		id: "ram",
		label: "System Memory",
		value: ramMb > 0 ? formatMb(ramMb) : "Unknown",
		icon: Zap,
		ok: ramMb >= 8000,
	},
	{
		id: "disk",
		label: "Free Disk Space",
		value: diskFreeMb > 0 ? `${formatMb(diskFreeMb)} available` : "Not reported",
		icon: HardDrive,
		ok: diskFreeMb === 0 ? true : diskFreeMb >= 5000,
	},
	{
		id: "models",
		label: "Models on Disk",
		value: modelCount > 0 ? `${modelCount} models found` : "None yet — pick them in the next step",
		icon: HardDrive,
		ok: true,
	},
]);

function handleContinue(): void {
	logInfo("wizard.system-check", "Continue clicked");
	overlayState.showConfig();
}

function handleBack(): void {
	logInfo("wizard.system-check", "Back clicked");
	overlayState.showWelcome();
}

function handleSkip(): void {
	logInfo("wizard.system-check", "Skip Setup clicked");
	overlayState.showDone();
}
</script>

<div class="system-check-view">
	<div class="sc-header">
		<img src="/imgs/mascot/clyffy-df-icon-interaction1.png" alt="Clyffy scanning" class="sc-mascot" />
		<div class="sc-title">
			<Heading level={2} size="lg">Your Setup</Heading>
			<Text size="sm" color="secondary">Here is what Clyffy sees on your machine.</Text>
		</div>
		<div class="sc-title-help">
			<WizardHelpTip
				tip="Detected at boot. Each row is read-only — change hardware via your OS, Clyffy re-detects on next launch."
				label="What is this?"
			/>
			<Button preset="button-ghost" size="sm" onclick={() => (showTierInfo = true)}>
				What tier means
			</Button>
		</div>
	</div>

	<div class="sc-spec-list">
		{#each specs as spec (spec.id)}
			<div class="sc-spec-row" class:sc-ok={spec.ok} class:sc-warn={!spec.ok}>
				<div class="sc-spec-icon">
					{#if hasHardware}
						<div class="sc-check-circle" class:sc-ok={spec.ok} class:sc-warn={!spec.ok}>
							{#if spec.ok}
								<Check size={14} />
							{:else}
								<AlertTriangle size={14} />
							{/if}
						</div>
					{:else}
						<Spinner size="sm" tone="accent" />
					{/if}
				</div>
				<div class="sc-spec-body">
					<Text size="sm" weight="bold">{spec.label}</Text>
					{#if hasHardware}
						<Text size="xs" color="muted">{spec.value}</Text>
					{:else}
						<Text size="xs" color="muted">Waiting for hardware data…</Text>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if hasHardware}
		<div class="sc-tier-badge" class:sc-tier-ok={tierTone === "positive"}>
			<div class="sc-tier-head">
				<Badge tone={tierTone} size="md">{tierLabel}</Badge>
				<Text size="xs" color="secondary">Performance tier</Text>
			</div>
			<Text size="sm" color="muted">{tierDescription}</Text>
		</div>
	{/if}

	{#if hasHardware && !hasGpu}
		<div class="sc-warning">
			<AlertTriangle size={16} />
			<Text size="sm">No GPU detected. Models will run on CPU — expect slower responses.</Text>
		</div>
	{/if}

	<div class="sc-actions">
		<Button preset="button-ghost" size="md" onclick={handleBack}>
			<ArrowLeft size={14} />
			Back
		</Button>
		<div class="sc-actions-right">
			<button class="sc-skip-link" onclick={handleSkip}>Skip — I'll set up later</button>
			<Button preset="button-primary" size="md" onclick={handleContinue}>
				Continue
				<ArrowRight size={14} />
			</Button>
		</div>
	</div>
</div>

<WizardInfoPopup
	open={showTierInfo}
	title="Performance tiers explained"
	summary="Tier is derived from detected VRAM. It drives which default models Jesse Config will recommend."
	points={[
		"High (24GB+ VRAM): full model stack, all slots GPU-accelerated.",
		"Jesse Primary (16GB+ VRAM): the target configuration. Brain on GPU, helpers on CPU.",
		"Mid (10GB+ VRAM): partial offload. Brain on GPU, smaller helpers on CPU.",
		"Floor (8GB+ VRAM): smaller brain, more CPU offload.",
		"Minimal or CPU Only: smallest models, responses will be slower.",
		"You can always override the auto-selected tier in the next step.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showTierInfo = false)}
/>

<style>
	.system-check-view {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
		max-width: 42rem;
		margin: 0 auto;
		padding: 1rem;
	}

	.sc-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.sc-mascot {
		width: 3.5rem;
		height: 3.5rem;
		object-fit: contain;
		flex-shrink: 0;
	}

	.sc-title {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.sc-title-help {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.sc-spec-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.sc-spec-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		transition: border-color 300ms ease-out;
	}
	.sc-spec-row.sc-ok {
		border-color: color-mix(in oklch, var(--wizard-role-minion-main) 40%, transparent);
	}
	.sc-spec-row.sc-warn {
		border-color: color-mix(in oklch, var(--signal-warning) 40%, transparent);
	}

	.sc-spec-icon {
		flex-shrink: 0;
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sc-check-circle {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.sc-check-circle.sc-ok {
		background: color-mix(in oklch, var(--wizard-role-minion-main) 20%, transparent);
		color: var(--wizard-role-minion-main);
	}
	.sc-check-circle.sc-warn {
		background: color-mix(in oklch, var(--signal-warning) 20%, transparent);
		color: var(--signal-warning);
	}

	.sc-spec-body {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		min-width: 0;
	}

	.sc-tier-badge {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		border-left: 3px solid var(--text-muted);
	}
	.sc-tier-badge.sc-tier-ok {
		border-left-color: var(--wizard-role-minion-main);
	}

	.sc-tier-head {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.sc-warning {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: color-mix(in oklch, var(--signal-warning) 10%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-warning) 30%, transparent);
		color: var(--signal-warning);
	}

	.sc-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.5rem;
		gap: 0.5rem;
	}

	.sc-actions-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.sc-skip-link {
		background: none;
		border: none;
		padding: 0;
		color: var(--text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		text-decoration: underline;
	}
	.sc-skip-link:hover {
		color: var(--text-secondary);
	}
</style>
