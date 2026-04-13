<!--
  @file WelcomeStep.svelte
  Canonical first screen for the setup overlay.
  Layman-friendly introduction, live hardware snapshot, and one clear CTA.
-->
<script lang="ts">
import { Cpu, HardDrive, LoaderCircle, Monitor, Sparkles, Zap } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { formatMb } from "../../../types/models.types.js";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import type { ClyffyTooltipsCopy, GreetingCopy, HardwareCopy } from "../wizard.types.js";

interface Props {
	onContinue: () => void;
	greeting: GreetingCopy;
	hardware: HardwareCopy;
	tooltips: ClyffyTooltipsCopy;
}

let { onContinue, greeting, hardware, tooltips }: Props = $props();
let showPageHelp = $state(false);
</script>

<div class="welcome-step">
	<div class="welcome-stage">
		<img
			src="/imgs/mascot/clyffy-anim-wobble.png"
			alt={greeting.mascot_alt}
			class="welcome-mascot"
		/>
		<div class="welcome-copy">
			<span class="welcome-kicker">First Run Setup</span>
			<Heading level={2} size="xl">{greeting.title}</Heading>
			<Text as="p" size="base" class="welcome-subtitle">{greeting.subtitle}</Text>
			<div class="welcome-help-row">
				<WizardHelpTip tip="DevPulse scans your hardware, picks a local-first model plan, verifies chat, and only then hands you the full app." />
				<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
					What happens next
				</Button>
			</div>
		</div>
	</div>

	{#if hardwareState.status !== "idle"}
		<section class="snapshot-panel" aria-label="Hardware snapshot">
			<div class="snapshot-head">
				<div class="snapshot-title-row">
					<Text size="xs" weight="bold" class="snapshot-kicker">Hardware Snapshot</Text>
					<WizardHelpTip tip="This quick summary is the basis for the first recommended model plan. You can override the choices later." />
				</div>
				<Text size="sm" class="snapshot-caption">
					This is what I’ll size your local AI stack for.
				</Text>
			</div>

			{#if hardwareState.status === "loading" && !hardwareState.hasSnapshot}
				<div class="snapshot-row snapshot-row-loading">
					<LoaderCircle size={16} class="animate-spin" />
					<span class="snapshot-value">Scanning your hardware...</span>
				</div>
			{:else if hardwareState.hasSnapshot}
				<div class="snapshot-grid">
					<div class="snapshot-row">
						<Monitor size={16} />
						<span class="snapshot-label">{hardware.gpu_label}</span>
						<span class="snapshot-value">{hardwareState.gpuSummary}</span>
						<WizardHelpTip tip={hardware.gpu_tooltip} label="What does GPU mean?" />
						{#if hardwareState.metrics?.gpu_vram_total_mb}
							<span class="snapshot-tag">
								{formatMb(hardwareState.metrics.gpu_vram_total_mb)} {hardware.vram_label}
							</span>
							<WizardHelpTip tip={tooltips.vram_info} label="What is VRAM?" />
						{/if}
					</div>

					{#if hardwareState.cpuName}
						<div class="snapshot-row">
							<Cpu size={16} />
							<span class="snapshot-label">{hardware.cpu_label}</span>
							<span class="snapshot-value">{hardwareState.cpuName}</span>
							<WizardHelpTip tip={hardware.cpu_tooltip} label="What does CPU mean?" />
						</div>
					{/if}

					{#if hardwareState.metrics?.ram_total_mb}
						<div class="snapshot-row">
							<Zap size={16} />
							<span class="snapshot-label">{hardware.ram_label}</span>
							<span class="snapshot-value">{formatMb(hardwareState.metrics.ram_total_mb)}</span>
							<WizardHelpTip tip={hardware.ram_tooltip} label="What does RAM mean?" />
						</div>
					{/if}

					{#if hardwareState.metrics?.disk_free_mb}
						<div class="snapshot-row">
							<HardDrive size={16} />
							<span class="snapshot-label">{hardware.disk_label}</span>
							<span class="snapshot-value">{formatMb(hardwareState.metrics.disk_free_mb)} free</span>
							<WizardHelpTip tip={hardware.disk_tooltip} label="What does disk space mean?" />
						</div>
					{/if}
				</div>

				{#if hardwareState.gpuError && !hardwareState.gpuName}
					<Text as="p" size="sm" class="snapshot-note">{hardwareState.gpuError}</Text>
				{/if}
			{:else if hardwareState.error}
				<div class="snapshot-row snapshot-row-loading">
					<Monitor size={16} />
					<span class="snapshot-value">Hardware preview unavailable right now</span>
				</div>
			{/if}
		</section>
	{/if}

	<div class="welcome-guidance">
		<Text as="p" size="sm" class="welcome-hint">{greeting.hint}</Text>
		<Text as="p" size="sm" class="welcome-hint-secondary">
			I’ll recommend the best local model plan for this machine and keep the decisions readable.
		</Text>
	</div>

	<Button preset="primary" size="lg" onclick={onContinue} aria-label={greeting.cta_aria}>
		<Sparkles size={18} />
		{greeting.cta_label}
	</Button>
</div>

<WizardInfoPopup
	open={showPageHelp}
	title="How first-run setup works"
	summary="This flow builds a local-first AI stack that fits your machine, then checks that the core assistant actually responds before you land in the product."
	points={[
		"Hardware snapshot: detect your GPU, CPU, memory, and available space.",
		"Model plan: pick the best default brain and supporting roles for this machine.",
		"Verification: test chat before the wizard lets you finish.",
		"Everything stays editable later, but this gets you to a working baseline fast.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showPageHelp = false)}
/>

<style>
	.welcome-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(1rem, 0.75rem + 1vw, 1.75rem);
		width: 100%;
		max-width: 42rem;
		padding: clamp(1rem, 0.75rem + 1vw, 1.5rem) 0;
		text-align: center;
	}

	.welcome-stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.875rem;
	}

	.welcome-mascot {
		width: clamp(4.5rem, 4rem + 2vw, 6rem);
		height: clamp(4.5rem, 4rem + 2vw, 6rem);
		object-fit: contain;
		filter: drop-shadow(0 0 1.5rem color-mix(in oklch, var(--accent-purple-main) 30%, transparent));
	}

	.welcome-copy {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.welcome-help-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.welcome-kicker {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--accent-teal-fill) 92%, transparent);
		border: var(--border-preset-default-width) solid color-mix(in oklch, var(--accent-teal-main) 35%, transparent);
		color: var(--accent-teal-main);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	:global(.welcome-subtitle) {
		max-width: 28rem;
		color: var(--text-secondary);
	}

	.snapshot-panel {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		width: 100%;
		padding: clamp(1rem, 0.75rem + 0.75vw, 1.25rem);
		border-radius: 1rem;
		background:
			linear-gradient(135deg, color-mix(in oklch, var(--accent-purple-fill) 84%, transparent), transparent 55%),
			var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
		box-shadow: var(--shadow-z2);
		text-align: left;
	}

	.snapshot-head {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.snapshot-title-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	:global(.snapshot-kicker) {
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	:global(.snapshot-caption) {
		color: var(--text-secondary);
	}

	.snapshot-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.snapshot-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.875rem;
		background: color-mix(in oklch, var(--surface-raised) 92%, transparent);
		border: var(--border-preset-default-width) solid var(--border-soft);
		color: var(--text-secondary);
	}

	.snapshot-row-loading {
		justify-content: center;
	}

	.snapshot-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		min-width: 2.5rem;
	}

	.snapshot-value {
		flex: 1;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.snapshot-tag {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.1875rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--accent-teal-fill) 92%, transparent);
		color: var(--accent-teal-main);
	}

	:global(.snapshot-note) {
		color: var(--text-muted);
	}

	.welcome-guidance {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-items: center;
	}

	:global(.welcome-hint) {
		color: var(--text-secondary);
	}

	:global(.welcome-hint-secondary) {
		max-width: 28rem;
		color: var(--text-muted);
	}
</style>
