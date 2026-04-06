<!--
  @file EscalationConfigPanel.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/EscalationConfigPanel

  Escalation priority chain configuration.
  Local slots first, API providers as fallback.
  API key management via platform keyring (Sprint 12).

  SECURITY: Key inputs are type="password". Keys NEVER stored in component state
  after submission. Only masked previews from get_api_key_status displayed.
-->
<script lang="ts">
import { Check, Key, TriangleAlert, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { isInferenceReady, statusLabel } from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";

interface ApiKeyStatus {
	provider: string;
	stored: boolean;
	masked_preview: string | null;
}

let keyStatuses = $state<ApiKeyStatus[]>([]);
let keyInputs = $state<Record<string, string>>({ Anthropic: "", OpenAI: "" });
let storeError = $state<string | null>(null);

const voiceBrainStatus = $derived(modelsState.statuses["voice.brain"] ?? { type: "cold" as const });
const chatBrainStatus = $derived(modelsState.statuses["chat.brain"] ?? { type: "cold" as const });

$effect(() => {
	refreshKeyStatuses();
});

async function refreshKeyStatuses(): Promise<void> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		keyStatuses = await invoke<ApiKeyStatus[]>("get_api_key_status");
	} catch (e) {
		storeError = e instanceof Error ? e.message : String(e);
	}
}

async function storeKey(providerName: string): Promise<void> {
	const key = keyInputs[providerName];
	if (!key) return;
	storeError = null;
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("store_api_key", { provider: providerName, key });
		keyInputs[providerName] = ""; // CLEAR immediately after store
		await refreshKeyStatuses();
	} catch (e) {
		storeError = e instanceof Error ? e.message : String(e);
	}
}

async function deleteKey(providerName: string): Promise<void> {
	storeError = null;
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("delete_api_key", { provider: providerName });
		await refreshKeyStatuses();
	} catch (e) {
		storeError = e instanceof Error ? e.message : String(e);
	}
}

function getKeyStatus(providerName: string): ApiKeyStatus | undefined {
	return keyStatuses.find((s) => s.provider === providerName);
}
</script>

<div
	class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg w-full border")}
	style="background: var(--surface-base); border-color: var(--border-subtle);"
>
	<div class={stack({ gap: "4" })}>
		<Text size="sm" weight="bold" color="primary">Escalation Config</Text>

		<!-- Priority chain -->
		<div class={stack({ gap: "2" })}>
			<Text size="xs" weight="bold" color="secondary">Priority Chain (top = tried first)</Text>

			{#each wizardState.escalationConfig.priorities as priority (priority.priority)}
				<div
					class={cn(box({ paddingX: "8", paddingY: "4" }), "rounded border")}
					style="background: var(--surface-elevated); border-color: var(--border-subtle);"
				>
					<div class={hstack({ gap: "3", align: "center" })}>
						<Text size="xs" weight="bold" color="muted">#{priority.priority}</Text>
						<Text size="xs" color="primary" class="flex-1">{priority.label}</Text>

						{#if priority.source === "local_slot" && priority.slotId}
							{@const status = priority.slotId === "voice.brain" ? voiceBrainStatus : chatBrainStatus}
							<Badge
								variant={isInferenceReady(status) ? "positive" : "neutral"}
								size="sm"
							>
								{statusLabel(status)}
							</Badge>
						{:else if priority.source === "api" && priority.apiProvider}
							{@const keyStatus = getKeyStatus(priority.apiProvider)}
							{#if keyStatus?.stored}
								<Badge variant="positive" size="sm">Key stored</Badge>
							{:else}
								<Badge variant="neutral" size="sm">No key</Badge>
							{/if}
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- API key management -->
		<div class={stack({ gap: "3" })}>
			<Text size="xs" weight="bold" color="secondary">API Keys</Text>

			{#each ["Anthropic", "OpenAI"] as providerName (providerName)}
				{@const status = getKeyStatus(providerName)}
				<div
					class={cn(box({ paddingX: "8", paddingY: "4" }), "rounded border")}
					style="background: var(--surface-elevated); border-color: var(--border-subtle);"
				>
					<div class={stack({ gap: "2" })}>
						<div class={hstack({ gap: "3", align: "center" })}>
							<Key size={12} style="color: var(--text-muted);" />
							<Text size="xs" weight="bold" color="primary">{providerName}</Text>
							{#if status?.stored}
								<Badge variant="positive" size="sm">Stored</Badge>
								<Text size="xs" color="muted">{status.masked_preview}</Text>
								<button
									class="rounded p-1 transition-colors"
									style="color: var(--text-muted);"
									onclick={() => deleteKey(providerName)}
									aria-label="Remove {providerName} API key"
								>
									<X size={12} />
								</button>
							{:else}
								<Badge variant="neutral" size="sm">Not set</Badge>
							{/if}
						</div>

						{#if !status?.stored}
							<div class={hstack({ gap: "2", align: "center" })}>
								<input
									type="password"
									placeholder="Paste {providerName} API key..."
									value={keyInputs[providerName]}
									oninput={(e) => { keyInputs[providerName] = e.currentTarget.value; }}
									class="flex-1 rounded-lg px-3 py-1.5 text-xs border"
									style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
									aria-label="{providerName} API key input"
								/>
								<button
									class="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors disabled:opacity-40"
									style="background: var(--accent-teal-main); color: var(--surface-base);"
									onclick={() => storeKey(providerName)}
									disabled={!keyInputs[providerName]}
									aria-label="Save {providerName} API key"
								>
									<Check size={10} />
									Save
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Detection mode -->
		<div class={hstack({ gap: "3", align: "center" })}>
			<Text size="xs" weight="bold" color="secondary">Detection:</Text>
			<Text size="xs" color="muted">Rule-based (local) — future: ML-based</Text>
		</div>

		<!-- Note about delivery mode -->
		<Text size="xs" color="muted">
			Delivery mode (stream/buffer/hybrid) is configured in the Latency Tuning tab.
		</Text>

		<!-- Error -->
		{#if storeError}
			<div class={hstack({ gap: "2", align: "center" })}>
				<TriangleAlert size={12} style="color: var(--signal-error);" />
				<Text size="xs" color="accent">{storeError}</Text>
			</div>
		{/if}
	</div>
</div>
