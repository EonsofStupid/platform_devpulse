<!--
  @file EscalationConfigPanel.svelte
  @domain models/setup-wizard/panels

  Escalation chain config — Voice Brain (CPU) → Main AI (GPU) →
  Cloud API. Each tier has an enable toggle plus a timeout slider
  (1–60 s). The Cloud API tier shows readiness based on whether ANY
  provider key is connected (cross-checks the ApiKeyPanel state).

  Persistence: `commands.routingSaveConfig` (engine
  `Platform::routing_config_save` → `{data_dir}/user/routing.toml`)
  via `setupWizardOverlayState.saveEscalation`. The engine round-trips
  the clamped value back, so the slider always reflects post-clamp
  truth. The kernel `assistant.routing.mode` is also write-through-
  updated so the chat dispatcher is gated by the same surface.

  DTCG tokens. No raw oklch literals. Layman copy.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { ArrowDown, Brain, Cloud, Cpu, Settings } from "lucide-svelte";
import { type ApiKeyStatus, commands, type EscalationTierId } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { setupWizardOverlayState } from "../../../data-access/setup-wizard-overlay.state.svelte.js";
import { isInferenceReady } from "../../../util/models.types.js";

const LOG_TARGET = "wizard.escalation";
const overlayState = setupWizardOverlayState;

interface TierMeta {
	id: EscalationTierId;
	label: string;
	desc: string;
	icon: typeof Brain;
	slotId?: string;
	accent: string;
}

const TIER_META: TierMeta[] = [
	{
		id: "voice_brain",
		label: "Voice Brain",
		desc: "Lightweight CPU model for fast turn-taking. Sub-second response.",
		icon: Cpu,
		slotId: "voice.brain",
		accent: "var(--wizard-role-voice-main)",
	},
	{
		id: "main_brain",
		label: "Main AI",
		desc: "Full reasoning model on your GPU. Handles complex questions.",
		icon: Brain,
		slotId: "chat.brain",
		accent: "var(--wizard-role-brain-main)",
	},
	{
		id: "cloud_api",
		label: "Cloud API",
		desc: "External AI service. Requires internet and a configured API key.",
		icon: Cloud,
		accent: "var(--accent-teal-main)",
	},
];

let apiKeyStatuses = $state<ApiKeyStatus[]>([]);
const hasAnyApiKey = $derived(apiKeyStatuses.some((s) => s.stored));
const connectedProviderNames = $derived(
	apiKeyStatuses
		.filter((s) => s.stored)
		.map((s) => s.displayName)
		.join(", "),
);

$effect(() => {
	void loadStatuses();
});

async function loadStatuses(): Promise<void> {
	logInfo(LOG_TARGET, "loadStatuses() → commands.getApiKeyStatus");
	try {
		const result = await commands.getApiKeyStatus();
		if (result.status === "ok") {
			apiKeyStatuses = result.data;
		} else {
			logError(LOG_TARGET, `loadStatuses() FAILED: ${result.error.message}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError(LOG_TARGET, `loadStatuses() threw: ${msg}`);
	}
}

function tierConfig(id: EscalationTierId) {
	return overlayState.routing.escalation.tiers.find((t) => t.id === id);
}

function slotReady(slotId: string | undefined): boolean {
	if (!slotId) return false;
	const status = modelsState.statuses[slotId];
	return status ? isInferenceReady(status) : false;
}

async function toggleTier(id: EscalationTierId): Promise<void> {
	logInfo(LOG_TARGET, `toggleTier(${id})`);
	const next = overlayState.routing.escalation.tiers.map((t) =>
		t.id === id ? { ...t, enabled: !t.enabled } : t,
	);
	await overlayState.saveEscalation(next);
}

async function updateTimeout(id: EscalationTierId, ms: number): Promise<void> {
	logInfo(LOG_TARGET, `updateTimeout(${id}, ${ms})`);
	const next = overlayState.routing.escalation.tiers.map((t) =>
		t.id === id ? { ...t, timeout_ms: ms } : t,
	);
	await overlayState.saveEscalation(next);
}
</script>

<div class="esc-panel">
	<div class="esc-head">
		<div class="esc-head-icon"><Settings size={18} /></div>
		<div class="esc-head-text">
			<Heading level={3} size="sm">Escalation chain</Heading>
			<Text size="xs" color="muted">
				When one tier can't answer, the request escalates to the next. Disable tiers you
				don't want involved.
			</Text>
		</div>
	</div>

	<div class="esc-chain">
		{#each TIER_META as meta, i (meta.id)}
			{@const cfg = tierConfig(meta.id)}
			{@const Icon = meta.icon}
			{@const ready =
				meta.id === "cloud_api" ? hasAnyApiKey : slotReady(meta.slotId)}
			{#if i > 0}
				<div class="esc-arrow" aria-hidden="true">
					<ArrowDown size={16} />
				</div>
			{/if}

			<div
				class="esc-tier"
				class:esc-tier-disabled={!cfg?.enabled}
				style:--tier-accent={meta.accent}
			>
				<div class="esc-tier-head">
					<div class="esc-tier-icon">
						<Icon size={16} />
					</div>
					<div class="esc-tier-info">
						<Text size="sm" weight="bold">{meta.label}</Text>
						<Text size="xs" color="muted">{meta.desc}</Text>
					</div>
					<label class="esc-switch" aria-label="Enable {meta.label}">
						<input
							type="checkbox"
							checked={cfg?.enabled ?? false}
							onchange={() => void toggleTier(meta.id)}
						/>
						<span class="esc-switch-slider"></span>
					</label>
				</div>

				{#if cfg?.enabled}
					<div class="esc-tier-body">
						<div class="esc-readiness">
							<span class="esc-dot" class:esc-dot-ready={ready}></span>
							{#if meta.id === "cloud_api"}
								{#if hasAnyApiKey}
									<Text size="xs" color="muted">
										Connected providers: {connectedProviderNames}
									</Text>
								{:else}
									<Text size="xs">
										No API keys yet — add one in the Cloud Providers panel above.
									</Text>
									<Badge variant="notice" size="sm">Action needed</Badge>
								{/if}
							{:else if ready}
								<Text size="xs" color="muted">Model loaded and ready.</Text>
							{:else}
								<Text size="xs" color="muted">
									Model not loaded yet — it will load on first escalation.
								</Text>
							{/if}
						</div>

						<div class="esc-timeout-row">
							<Text size="xs" color="muted" class="esc-timeout-label">Timeout</Text>
							<input
								type="range"
								class="esc-range"
								min={1000}
								max={60000}
								step={1000}
								value={cfg.timeout_ms}
								oninput={(e) =>
									void updateTimeout(meta.id, Number(e.currentTarget.value))}
								aria-label="{meta.label} timeout in seconds"
							/>
							<Text size="xs" weight="bold" class="esc-timeout-value">
								{(cfg.timeout_ms / 1000).toFixed(0)}s
							</Text>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<Text size="xs" color="muted">
		The chain runs top to bottom. If a tier times out or fails, the request escalates to the
		next enabled tier. Cloud API requires at least one provider key.
	</Text>
</div>

<style>
	.esc-panel {
		display: flex;
		flex-direction: column;
		gap: clamp(0.625rem, 1.25vw, 0.875rem);
	}

	.esc-head {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
	}
	.esc-head-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--accent-teal-main) 25%, transparent);
		color: var(--accent-teal-main);
		flex-shrink: 0;
	}
	.esc-head-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.esc-chain {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.esc-arrow {
		display: flex;
		justify-content: center;
		color: var(--text-muted);
		padding: 0.125rem 0;
	}

	.esc-tier {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.625rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		border-left: 3px solid var(--tier-accent, var(--accent-teal-main));
		transition: opacity 150ms ease-out;
	}
	.esc-tier-disabled {
		opacity: 0.55;
	}

	.esc-tier-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.esc-tier-icon {
		color: var(--tier-accent, var(--accent-teal-main));
		flex-shrink: 0;
	}
	.esc-tier-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.esc-switch {
		position: relative;
		width: 2.25rem;
		height: 1.125rem;
		flex-shrink: 0;
	}
	.esc-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}
	.esc-switch-slider {
		position: absolute;
		inset: 0;
		border-radius: 999px;
		background: var(--surface-inset);
		border: 1px solid var(--border-soft);
		cursor: pointer;
		transition: background 150ms ease-out;
	}
	.esc-switch-slider::before {
		content: "";
		position: absolute;
		left: 0.125rem;
		top: 0.125rem;
		width: 0.875rem;
		height: 0.875rem;
		border-radius: 999px;
		background: var(--text-muted);
		transition: transform 150ms ease-out, background 150ms ease-out;
	}
	.esc-switch input:checked + .esc-switch-slider {
		background: color-mix(in oklch, var(--tier-accent, var(--accent-teal-main)) 40%, transparent);
		border-color: var(--tier-accent, var(--accent-teal-main));
	}
	.esc-switch input:checked + .esc-switch-slider::before {
		transform: translateX(1.125rem);
		background: var(--tier-accent, var(--accent-teal-main));
	}

	.esc-tier-body {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.esc-readiness {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.esc-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: var(--text-muted);
		flex-shrink: 0;
	}
	.esc-dot-ready {
		background: var(--signal-success);
		box-shadow: 0 0 0.375rem color-mix(in oklch, var(--signal-success) 60%, transparent);
	}

	.esc-timeout-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	:global(.esc-timeout-label) {
		min-width: 4rem;
	}
	:global(.esc-timeout-value) {
		min-width: 2.25rem;
		text-align: right;
	}

	.esc-range {
		flex: 1;
		accent-color: var(--tier-accent, var(--accent-teal-main));
	}
</style>
