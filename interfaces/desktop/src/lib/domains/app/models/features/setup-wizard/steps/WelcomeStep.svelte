<!--
  @file WelcomeStep.svelte
  Entry screen. Clyffy greeting. Hardware preview. "Let's Go" CTA.
  ColdLight tokens. Zero hardcoded colors.
-->
<script lang="ts">
import { Cpu, HardDrive, Monitor, Sparkles, Zap } from "lucide-svelte";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { formatMb } from "../../../types/models.types.js";

interface Props {
	onContinue: () => void;
}
let { onContinue }: Props = $props();
</script>

<div class="welcome">
	<!-- Clyffy avatar -->
	<div class="avatar">
		<span class="avatar-letter">C</span>
		<div class="avatar-glow"></div>
	</div>

	<!-- Greeting -->
	<h2 class="greeting">Hey! I'm Clyffy.</h2>
	<p class="sub">I'll help you set up your AI models. It only takes a minute.</p>

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

	<p class="ready">I'll recommend the best models for your hardware.</p>

	<!-- CTA -->
	<button class="cta" onclick={onContinue} aria-label="Start setup">
		<Sparkles size={18} />
		Let's Go
	</button>
</div>

<style>
	.welcome {
		display: flex; flex-direction: column; align-items: center; justify-content: center;
		gap: 1.25rem; min-height: 60vh; text-align: center; padding: 2rem;
	}

	.avatar {
		position: relative; width: 5rem; height: 5rem; border-radius: var(--wiz-radius-full);
		background: var(--wiz-fill-purple); border: 2px solid var(--wiz-glow-purple);
		display: flex; align-items: center; justify-content: center;
	}
	.avatar-letter { font-size: 2rem; font-weight: 800; color: var(--wiz-role-brain); }
	.avatar-glow {
		position: absolute; inset: -0.5rem; border-radius: var(--wiz-radius-full);
		background: var(--wiz-fill-purple); filter: blur(12px); z-index: -1;
	}

	.greeting { font-size: 1.5rem; font-weight: 800; color: var(--wiz-text); margin: 0; }
	.sub { font-size: 0.9375rem; color: var(--wiz-text-sub); margin: 0; max-width: 24rem; }
	.ready { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); margin: 0; }

	.hw-preview {
		display: flex; flex-direction: column; gap: 0.5rem;
		background: var(--wiz-card); border: 1px solid var(--wiz-border);
		border-radius: var(--wiz-radius-lg); padding: 1rem; width: 100%; max-width: 22rem;
	}
	.hw-row { display: flex; align-items: center; gap: 0.5rem; color: var(--wiz-text-sub); }
	.hw-label { font-size: var(--wiz-text-xs); font-weight: 700; color: var(--wiz-text-muted); width: 2.5rem; }
	.hw-value { flex: 1; font-size: var(--wiz-text-sm); color: var(--wiz-text); }
	.hw-tag {
		font-size: var(--wiz-text-xs); padding: 0.125rem 0.375rem; border-radius: var(--wiz-radius-sm);
		background: var(--wiz-fill-cyan); color: var(--wiz-cyan);
	}

	.cta {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.75rem 2rem; border-radius: var(--wiz-radius-lg); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: 1rem; font-weight: 800; cursor: pointer;
		box-shadow: 0 0 1.5rem 0.25rem var(--wiz-glow-cyan);
		transition: filter var(--wiz-duration-fast), box-shadow var(--wiz-duration-fast);
	}
	.cta:hover { filter: brightness(1.15); box-shadow: 0 0 2rem 0.5rem var(--wiz-glow-cyan); }
</style>
