<!--
  @file WelcomeStep.svelte
  Entry screen. Clyffy greeting. Hardware preview. "Let's Go" CTA.
  ColdLight components + tokens. Zero hardcoded colors.
-->
<script lang="ts">
import { Cpu, HardDrive, Monitor, Sparkles, Zap } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { formatMb } from "../../../types/models.types.js";

interface Props {
	onContinue: () => void;
}
let { onContinue }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-5 min-h-[60vh] text-center p-8">
	<!-- Clyffy avatar -->
	<div class="avatar">
		<span class="text-2xl font-extrabold" style="color: var(--accent-purple-main);">C</span>
		<div class="avatar-glow"></div>
	</div>

	<!-- Greeting -->
	<Heading level={2} size="xl">Hey! I'm Clyffy.</Heading>
	<Text as="p" size="base" style="color: var(--text-secondary); max-width: 24rem;">
		I'll help you set up your AI models. It only takes a minute.
	</Text>

	<!-- Quick hardware preview -->
	{#if hardwareState.gpuName || hardwareState.cpuName}
		<div class="hw-preview">
			{#if hardwareState.gpuName}
				<div class="hw-row">
					<Monitor size={16} />
					<span class="hw-label">GPU</span>
					<span class="hw-value">{hardwareState.gpuName}</span>
					{#if hardwareState.vramTotalMb}
						<span class="hw-tag">{formatMb(hardwareState.vramTotalMb)} VRAM</span>
					{/if}
				</div>
			{/if}
			{#if hardwareState.cpuName}
				<div class="hw-row">
					<Cpu size={16} />
					<span class="hw-label">CPU</span>
					<span class="hw-value">{hardwareState.cpuName}</span>
				</div>
			{/if}
			{#if hardwareState.ramTotalMb}
				<div class="hw-row">
					<Zap size={16} />
					<span class="hw-label">RAM</span>
					<span class="hw-value">{formatMb(hardwareState.ramTotalMb)}</span>
				</div>
			{/if}
			{#if hardwareState.diskFreeMb}
				<div class="hw-row">
					<HardDrive size={16} />
					<span class="hw-label">Disk</span>
					<span class="hw-value">{formatMb(hardwareState.diskFreeMb)} free</span>
				</div>
			{/if}
		</div>
	{/if}

	<Text as="p" size="sm" style="color: var(--text-muted);">
		I'll recommend the best models for your hardware.
	</Text>

	<!-- CTA -->
	<Button preset="primary" onclick={onContinue}>
		<Sparkles size={18} />
		Let's Go
	</Button>
</div>

<style>
	/* Avatar — accent-purple circle with glow halo */
	.avatar {
		position: relative;
		width: 5rem;
		height: 5rem;
		border-radius: var(--radius-full);
		background: var(--accent-purple-fill);
		border: 2px solid var(--accent-purple-glow);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.avatar-glow {
		position: absolute;
		inset: -0.5rem;
		border-radius: var(--radius-full);
		background: var(--accent-purple-fill);
		filter: blur(0.75rem);
		z-index: -1;
	}

	/* Hardware preview card */
	.hw-preview {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		background: var(--surface-raised);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		width: 100%;
		max-width: 22rem;
	}
	.hw-row {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--text-secondary);
	}
	.hw-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		width: 2.5rem;
	}
	.hw-value {
		flex: 1;
		font-size: 0.875rem;
		color: var(--text-primary);
	}
	.hw-tag {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		border-radius: var(--radius-sm);
		background: var(--accent-teal-fill);
		color: var(--accent-teal-main);
	}
</style>
