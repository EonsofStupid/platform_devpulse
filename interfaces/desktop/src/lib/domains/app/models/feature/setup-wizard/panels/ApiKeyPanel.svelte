<!--
  @file ApiKeyPanel.svelte
  @domain models/setup-wizard/panels

  Cloud API key management — Anthropic, OpenAI, Google, and any other
  provider the SSOT registry returns from `get_api_key_status`. Stores
  via the OS keychain through `commands.storeApiKey`. Masked preview
  for stored keys. Layman copy explains WHY a customer might add a
  key — local-first works without them; keys unlock cloud fallback.

  No "sidecar" wording in the user-facing strings (per
  `feedback_no_sidecar_in_ui.md`). All IPC wraps in `withAction` so
  the action HUD shows progress.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { Check, Cloud, Eye, EyeOff, Key, Plus, Shield, Trash2, X } from "lucide-svelte";
import { withAction } from "$lib/sys/action-bus.svelte.js";
import { type ApiKeyStatus, commands, type ProviderId } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

const LOG_TARGET = "wizard.api-keys";

interface ProviderMeta {
	id: ProviderId;
	desc: string;
	placeholder: string;
	helpText: string;
}

// Layman descriptions per provider. Keys not in this map fall back to
// the provider's `displayName` only — keeps the panel useful when the
// SSOT registry adds providers we haven't authored copy for yet.
const PROVIDER_META: Partial<Record<ProviderId, ProviderMeta>> = {
	"anthropic-api": {
		id: "anthropic-api",
		desc: "Your Claude billing account. Used when local models need help with complex reasoning, or as a cloud fallback.",
		placeholder: "sk-ant-api03-...",
		helpText: "Get your key at console.anthropic.com → API Keys.",
	},
	"open-ai": {
		id: "open-ai",
		desc: "OpenAI GPT models. Optional fallback for tasks Claude and your local model can't handle.",
		placeholder: "sk-proj-...",
		helpText: "Get your key at platform.openai.com → API Keys.",
	},
	"google-gemini": {
		id: "google-gemini",
		desc: "Google Gemini. Optional cloud fallback when other providers aren't available.",
		placeholder: "AIza...",
		helpText: "Get your key at aistudio.google.com → API Keys.",
	},
	mistral: {
		id: "mistral",
		desc: "Mistral la Plateforme. Optional cloud fallback.",
		placeholder: "...",
		helpText: "Get your key at console.mistral.ai → API Keys.",
	},
	cohere: {
		id: "cohere",
		desc: "Cohere. Optional cloud fallback.",
		placeholder: "...",
		helpText: "Get your key at dashboard.cohere.com.",
	},
	xai: {
		id: "xai",
		desc: "xAI Grok. Optional cloud fallback.",
		placeholder: "...",
		helpText: "Get your key at console.x.ai.",
	},
	"deep-seek": {
		id: "deep-seek",
		desc: "DeepSeek. Optional cloud fallback.",
		placeholder: "...",
		helpText: "Get your key at platform.deepseek.com.",
	},
	groq: {
		id: "groq",
		desc: "Groq. Optional cloud fallback for high-throughput inference.",
		placeholder: "...",
		helpText: "Get your key at console.groq.com.",
	},
	together: {
		id: "together",
		desc: "Together AI. Optional cloud fallback.",
		placeholder: "...",
		helpText: "Get your key at api.together.xyz.",
	},
	fireworks: {
		id: "fireworks",
		desc: "Fireworks AI. Optional cloud fallback.",
		placeholder: "...",
		helpText: "Get your key at fireworks.ai.",
	},
	replicate: {
		id: "replicate",
		desc: "Replicate. Optional cloud fallback.",
		placeholder: "...",
		helpText: "Get your key at replicate.com/account.",
	},
	"hugging-face": {
		id: "hugging-face",
		desc: "Hugging Face Inference Endpoints. Optional cloud fallback.",
		placeholder: "hf_...",
		helpText: "Get your key at huggingface.co/settings/tokens.",
	},
};

let statuses = $state<ApiKeyStatus[]>([]);
let loading = $state(true);
let editingProvider = $state<ProviderId | null>(null);
let inputValue = $state("");
let showInput = $state(false);
let saving = $state(false);
let deleting = $state<ProviderId | null>(null);
let panelError = $state<string | null>(null);
let successMsg = $state<string | null>(null);

$effect(() => {
	void loadStatuses();
});

async function loadStatuses(): Promise<void> {
	loading = true;
	panelError = null;
	logInfo(LOG_TARGET, "loadStatuses() → commands.getApiKeyStatus");
	try {
		const result = await commands.getApiKeyStatus();
		if (result.status === "ok") {
			statuses = result.data;
			logInfo(LOG_TARGET, `loadStatuses() DONE — ${statuses.length} providers`);
		} else {
			panelError = result.error.message ?? "Failed to load API key status.";
			logError(LOG_TARGET, `loadStatuses() FAILED: ${panelError}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		panelError = msg;
		logError(LOG_TARGET, `loadStatuses() threw: ${msg}`);
	} finally {
		loading = false;
	}
}

function startEditing(provider: ProviderId): void {
	logInfo(LOG_TARGET, `startEditing(${provider})`);
	editingProvider = provider;
	inputValue = "";
	showInput = false;
	panelError = null;
	successMsg = null;
}

function cancelEditing(): void {
	logInfo(LOG_TARGET, "cancelEditing()");
	editingProvider = null;
	inputValue = "";
	showInput = false;
}

async function saveKey(): Promise<void> {
	if (!editingProvider || !inputValue.trim()) return;
	const provider = editingProvider;
	saving = true;
	panelError = null;
	successMsg = null;
	logInfo(LOG_TARGET, `saveKey(${provider}) BEGIN`);
	try {
		const result = await withAction(
			"wizard.storeApiKey",
			"Saving your API key securely…",
			async () => commands.storeApiKey(provider, inputValue.trim()),
		);
		if (result.status === "ok") {
			successMsg = `${displayNameFor(provider)} key saved to your OS keychain.`;
			inputValue = "";
			editingProvider = null;
			logInfo(LOG_TARGET, `saveKey(${provider}) DONE`);
			await loadStatuses();
		} else {
			panelError = result.error.message ?? "Failed to save key.";
			logError(LOG_TARGET, `saveKey(${provider}) FAILED: ${panelError}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		panelError = msg;
		logError(LOG_TARGET, `saveKey(${provider}) threw: ${msg}`);
	} finally {
		saving = false;
	}
}

async function deleteKey(provider: ProviderId): Promise<void> {
	deleting = provider;
	panelError = null;
	logInfo(LOG_TARGET, `deleteKey(${provider}) BEGIN`);
	try {
		const result = await withAction(
			"wizard.deleteApiKey",
			"Removing the stored API key…",
			async () => commands.deleteApiKey(provider),
		);
		if (result.status === "ok") {
			successMsg = `${displayNameFor(provider)} key removed.`;
			logInfo(LOG_TARGET, `deleteKey(${provider}) DONE`);
			await loadStatuses();
		} else {
			panelError = result.error.message ?? "Failed to remove key.";
			logError(LOG_TARGET, `deleteKey(${provider}) FAILED: ${panelError}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		panelError = msg;
		logError(LOG_TARGET, `deleteKey(${provider}) threw: ${msg}`);
	} finally {
		deleting = null;
	}
}

function displayNameFor(provider: ProviderId): string {
	return statuses.find((s) => s.provider === provider)?.displayName ?? provider;
}

function metaFor(provider: ProviderId): ProviderMeta | null {
	return PROVIDER_META[provider] ?? null;
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter") void saveKey();
	if (e.key === "Escape") cancelEditing();
}
</script>

<div class="ak-panel">
	<div class="ak-head">
		<div class="ak-head-icon"><Key size={18} /></div>
		<div class="ak-head-text">
			<Heading level={3} size="sm">Cloud AI providers</Heading>
			<Text size="xs" color="muted">
				Optional. Your local AI runs without these. Add keys to unlock cloud fallback when
				local models need help.
			</Text>
		</div>
	</div>

	<div class="ak-security">
		<Shield size={14} />
		<Text size="xs">
			Keys live in your OS keychain (Windows Credential Manager). They never leave your
			machine except in API calls you trigger.
		</Text>
	</div>

	{#if loading}
		<div class="ak-loading">
			<Spinner size="sm" />
			<Text size="xs" color="muted">Checking stored keys…</Text>
		</div>
	{/if}

	{#if panelError}
		<div class="ak-error" role="alert">
			<Text size="xs">{panelError}</Text>
		</div>
	{/if}

	{#if successMsg}
		<div class="ak-success" role="status">
			<Check size={14} />
			<Text size="xs">{successMsg}</Text>
		</div>
	{/if}

	{#each statuses as status (status.provider)}
		{@const isEditing = editingProvider === status.provider}
		{@const isDeleting = deleting === status.provider}
		{@const meta = metaFor(status.provider)}
		<div class="ak-card" class:ak-card-stored={status.stored}>
			<div class="ak-card-head">
				<div class="ak-card-icon"><Cloud size={18} /></div>
				<div class="ak-card-info">
					<Text size="sm" weight="bold">{status.displayName}</Text>
					<Text size="xs" color="muted">
						{meta?.desc ?? "Cloud provider — optional fallback."}
					</Text>
				</div>
				<div class="ak-card-status">
					{#if status.stored}
						<Badge variant="positive" size="sm">
							<Check size={10} />
							Connected
						</Badge>
					{:else}
						<Badge variant="neutral" size="sm">Not set up</Badge>
					{/if}
				</div>
			</div>

			{#if status.stored && !isEditing}
				<div class="ak-key-info">
					<code class="ak-key-mask">{status.maskedPreview ?? "••••••••"}</code>
					<div class="ak-key-actions">
						<Button preset="secondary" size="sm" onclick={() => startEditing(status.provider)}>
							Update key
						</Button>
						<Button
							preset="ghost"
							size="sm"
							disabled={isDeleting}
							onclick={() => deleteKey(status.provider)}
							aria-label="Remove {status.displayName} key"
						>
							{#if isDeleting}
								<Spinner size="xs" />
							{:else}
								<Trash2 size={14} />
							{/if}
						</Button>
					</div>
				</div>
			{/if}

			{#if !status.stored && !isEditing}
				<div class="ak-add-row">
					<Button preset="primary" size="sm" onclick={() => startEditing(status.provider)}>
						<Plus size={14} />
						Add API key
					</Button>
				</div>
			{/if}

			{#if isEditing}
				<div class="ak-edit">
					<div class="ak-edit-input-row">
						<input
							type={showInput ? "text" : "password"}
							class="ak-edit-input"
							bind:value={inputValue}
							placeholder={meta?.placeholder ?? "Paste your key here"}
							onkeydown={handleKeydown}
							aria-label="Enter {status.displayName} API key"
						/>
						<Button
							preset="ghost"
							size="sm"
							onclick={() => (showInput = !showInput)}
							aria-label={showInput ? "Hide key" : "Show key"}
						>
							{#if showInput}
								<EyeOff size={14} />
							{:else}
								<Eye size={14} />
							{/if}
						</Button>
					</div>
					{#if meta?.helpText}
						<Text size="xs" color="muted">{meta.helpText}</Text>
					{/if}
					<div class="ak-edit-actions">
						<Button
							preset="primary"
							size="sm"
							disabled={saving || !inputValue.trim()}
							onclick={saveKey}
						>
							{#if saving}
								<Spinner size="xs" />
								Saving…
							{:else}
								<Check size={14} />
								Save key
							{/if}
						</Button>
						<Button preset="ghost" size="sm" onclick={cancelEditing}>
							<X size={14} />
							Cancel
						</Button>
					</div>
				</div>
			{/if}
		</div>
	{/each}

	<div class="ak-why">
		<Text size="xs" weight="bold">Why add API keys?</Text>
		<Text size="xs" color="muted">
			DevPulse runs AI locally. Some tasks benefit from cloud help — long documents,
			complex reasoning, or when your local model is busy. API keys let DevPulse escalate
			to cloud providers only when the chain you configure asks for it.
			<strong>No keys = fully local. Always.</strong>
		</Text>
	</div>
</div>

<style>
	.ak-panel {
		display: flex;
		flex-direction: column;
		gap: clamp(0.625rem, 1.25vw, 0.875rem);
	}

	.ak-head {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
	}
	.ak-head-icon {
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
	.ak-head-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.ak-security {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--signal-success) 10%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-success) 25%, var(--border-soft));
		color: var(--signal-success);
	}

	.ak-loading {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
		padding: 0.5rem;
	}

	.ak-error {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--signal-error) 12%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-error) 35%, transparent);
		color: var(--signal-error);
	}

	.ak-success {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--signal-success) 12%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-success) 30%, transparent);
		color: var(--signal-success);
	}

	.ak-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0.875rem;
		border-radius: 0.625rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
	}
	.ak-card-stored {
		border-color: color-mix(in oklch, var(--signal-success) 35%, var(--border-soft));
		box-shadow: 0 0 0.625rem color-mix(in oklch, var(--signal-success) 12%, transparent);
	}

	.ak-card-head {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
	}
	.ak-card-icon {
		color: var(--text-secondary);
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
	.ak-card-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}
	.ak-card-status {
		flex-shrink: 0;
	}

	.ak-key-info {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.375rem 0.625rem;
		background: var(--surface-base);
		border-radius: 0.5rem;
	}
	.ak-key-mask {
		flex: 1;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.75rem;
		color: var(--text-muted);
		letter-spacing: 0.05em;
	}
	.ak-key-actions {
		display: flex;
		gap: 0.25rem;
	}

	.ak-add-row {
		display: flex;
	}

	.ak-edit {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.ak-edit-input-row {
		display: flex;
		gap: 0.375rem;
	}
	.ak-edit-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-soft);
		background: var(--surface-base);
		color: var(--text-primary);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.8125rem;
		outline: none;
		transition: border-color 150ms ease-out;
	}
	.ak-edit-input:focus {
		border-color: var(--accent-teal-main);
	}
	.ak-edit-actions {
		display: flex;
		gap: 0.375rem;
	}

	.ak-why {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--surface-base);
		border: 1px solid var(--border-soft);
	}
</style>
