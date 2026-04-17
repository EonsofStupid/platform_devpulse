<!--
  @file ApiKeyPanel.svelte
  API key management for cloud AI providers: Anthropic (Claude), OpenAI, Google (Gemini).
  Stores keys securely via Rust credential backend (OS keychain).
  Shows masked preview for stored keys. Add/update/delete per provider.
  Layman-friendly: explains WHY you'd want API keys, what each provider does.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { Check, Cloud, Eye, EyeOff, Key, Plus, Shield, Trash2, X } from "lucide-svelte";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { withAction } from "$lib/sys/action-bus.svelte.js";
import { type ApiKeyStatus, type ApiProvider, commands } from "$lib/sys/generated/bindings.js";

// ── Provider metadata (layman-friendly) ────────────────
const PROVIDERS: Array<{
	id: ApiProvider;
	name: string;
	desc: string;
	placeholder: string;
	helpText: string;
	color: string;
}> = [
	{
		id: "Anthropic",
		name: "Claude (Anthropic)",
		desc: "Your Claude AI subscription. Used when local models need help with complex tasks, or as a cloud fallback.",
		placeholder: "sk-ant-api03-...",
		helpText: "Get your key at console.anthropic.com → API Keys",
		color: "oklch(0.65 0.15 30)",
	},
	{
		id: "OpenAI",
		name: "OpenAI (GPT)",
		desc: "Optional fallback. If Claude and local models can't handle a task, this kicks in.",
		placeholder: "sk-proj-...",
		helpText: "Get your key at platform.openai.com → API Keys",
		color: "oklch(0.72 0.16 152)",
	},
	{
		id: "Google",
		name: "Google (Gemini)",
		desc: "Optional. Another cloud fallback for when other providers are unavailable.",
		placeholder: "AIza...",
		helpText: "Get your key at aistudio.google.com → API Keys",
		color: "oklch(0.65 0.14 250)",
	},
];

// ── State ─────────────────────────────────────────────
let statuses = $state<ApiKeyStatus[]>([]);
let loading = $state(true);
let editingProvider = $state<ApiProvider | null>(null);
let inputValue = $state("");
let showInput = $state(false);
let saving = $state(false);
let deleting = $state<string | null>(null);
let error = $state<string | null>(null);
let successMsg = $state<string | null>(null);
let tooltipVisible = $state<string | null>(null);
let tooltipTimer = $state<ReturnType<typeof setTimeout> | null>(null);

function showTooltip(id: string) {
	if (tooltipTimer) clearTimeout(tooltipTimer);
	tooltipTimer = setTimeout(() => {
		tooltipVisible = id;
	}, 300);
}
function hideTooltip() {
	if (tooltipTimer) clearTimeout(tooltipTimer);
	tooltipVisible = null;
}

// ── Load status on mount ─────────────────────────────
$effect(() => {
	loadStatuses();
});

async function loadStatuses(): Promise<void> {
	loading = true;
	error = null;
	try {
		const result = await commands.getApiKeyStatus();
		if (result.status === "ok") {
			statuses = result.data;
		} else {
			error = result.error;
		}
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	} finally {
		loading = false;
	}
}

function getStatus(provider: ApiProvider): ApiKeyStatus | undefined {
	return statuses.find((s) => s.provider === provider);
}

function startEditing(provider: ApiProvider): void {
	editingProvider = provider;
	inputValue = "";
	showInput = false;
	error = null;
	successMsg = null;
}

function cancelEditing(): void {
	editingProvider = null;
	inputValue = "";
	showInput = false;
}

async function saveKey(): Promise<void> {
	if (!editingProvider || !inputValue.trim()) return;
	saving = true;
	error = null;
	successMsg = null;
	try {
		const result = await withAction(
			"wizard.storeApiKey",
			"Saving your API key securely…",
			async () => commands.storeApiKey(editingProvider, inputValue.trim()),
		);
		if (result.status === "ok") {
			successMsg = `${editingProvider} key saved securely`;
			inputValue = "";
			editingProvider = null;
			await loadStatuses();
		} else {
			error = result.error;
		}
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	} finally {
		saving = false;
	}
}

async function deleteKey(provider: ApiProvider): Promise<void> {
	deleting = provider;
	error = null;
	try {
		const result = await withAction(
			"wizard.deleteApiKey",
			"Removing the stored API key…",
			async () => commands.deleteApiKey(provider),
		);
		if (result.status === "ok") {
			successMsg = `${provider} key removed`;
			await loadStatuses();
		} else {
			error = result.error;
		}
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	} finally {
		deleting = null;
	}
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter") saveKey();
	if (e.key === "Escape") cancelEditing();
}
</script>

<div class="panel">
	<div class="panel-header">
		<Key size={20} />
		<div class="header-text">
			<h3 class="title">Cloud AI Providers</h3>
			<p class="subtitle">Optional. Your local AI runs without these. Add keys to unlock cloud fallback when local models need help.</p>
		</div>
	</div>

	<!-- Security note -->
	<div class="security-note" role="note"
		onmouseenter={() => showTooltip("security")}
		onmouseleave={hideTooltip}>
		<Shield size={14} />
		<span>Keys are stored in your OS keychain (Windows Credential Manager). Never sent to DevPulse servers.</span>
		{#if tooltipVisible === "security"}
			<div class="tooltip">Your API keys are encrypted by your operating system's built-in credential manager. They never leave your machine. DevPulse reads them only when making API calls you explicitly requested.</div>
		{/if}
	</div>

	{#if loading}
		<div class="center"><Spinner size="sm" /><span>Checking stored keys...</span></div>
	{/if}

	{#if error}
		<div class="error-box">{error}</div>
	{/if}

	{#if successMsg}
		<div class="success-box"><Check size={14} />{successMsg}</div>
	{/if}

	<!-- Provider cards -->
	{#each PROVIDERS as prov (prov.id)}
		{@const status = getStatus(prov.id)}
		{@const isStored = status?.stored ?? false}
		{@const isEditing = editingProvider === prov.id}
		{@const isDeleting = deleting === prov.id}

		<div class="provider-card" class:stored={isStored}>
			<div class="prov-header">
				<div class="prov-icon" style="color:{prov.color}"><Cloud size={20} /></div>
				<div class="prov-info">
					<span class="prov-name">{prov.name}</span>
					<span class="prov-desc">{prov.desc}</span>
				</div>
				<div class="prov-status">
					{#if isStored}
						<span class="status-badge stored-badge"><Check size={12} /> Connected</span>
					{:else}
						<span class="status-badge empty-badge">Not Set Up</span>
					{/if}
				</div>
			</div>

			<!-- Stored key info -->
			{#if isStored && !isEditing}
				<div class="key-info">
					<span class="key-masked">{status?.masked_preview ?? "••••••••"}</span>
					<div class="key-actions">
						<button class="btn-outline-sm" onclick={() => startEditing(prov.id)}
							onmouseenter={() => showTooltip(`update-${prov.id}`)}
							onmouseleave={hideTooltip}
							aria-label="Update {prov.name} key">
							Update Key
						</button>
						{#if tooltipVisible === `update-${prov.id}`}
							<div class="tooltip">Replace this key with a new one</div>
						{/if}

						<button class="btn-delete-sm" onclick={() => deleteKey(prov.id)}
							disabled={isDeleting}
							onmouseenter={() => showTooltip(`delete-${prov.id}`)}
							onmouseleave={hideTooltip}
							aria-label="Delete {prov.name} key">
							{#if isDeleting}<Spinner size="sm" />{:else}<Trash2 size={14} />{/if}
						</button>
						{#if tooltipVisible === `delete-${prov.id}`}
							<div class="tooltip">Remove this key permanently. You can add a new one anytime.</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Not stored — add key prompt -->
			{#if !isStored && !isEditing}
				<button class="add-key-btn" onclick={() => startEditing(prov.id)}
					aria-label="Add {prov.name} API key">
					<Plus size={14} /> Add API Key
				</button>
			{/if}

			<!-- Editing mode -->
			{#if isEditing}
				<div class="edit-section">
					<div class="input-row">
						<input
							type={showInput ? "text" : "password"}
							class="key-input"
							bind:value={inputValue}
							placeholder={prov.placeholder}
							onkeydown={handleKeydown}
							aria-label="Enter {prov.name} API key"
						/>
						<button class="btn-icon" onclick={() => (showInput = !showInput)}
							aria-label={showInput ? "Hide key" : "Show key"}>
							{#if showInput}<EyeOff size={16} />{:else}<Eye size={16} />{/if}
						</button>
					</div>
					<p class="help-text">{prov.helpText}</p>
					<div class="edit-actions">
						<button class="btn-accent" onclick={saveKey} disabled={saving || !inputValue.trim()}
							aria-label="Save {prov.name} API key">
							{#if saving}<Spinner size="sm" /> Saving...{:else}<Check size={14} /> Save Key{/if}
						</button>
						<button class="btn-outline-sm" onclick={cancelEditing} aria-label="Cancel">
							<X size={14} /> Cancel
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/each}

	<!-- Why section -->
	<div class="why-section" role="note"
		onmouseenter={() => showTooltip("why")}
		onmouseleave={hideTooltip}>
		<h4 class="why-title">Why add API keys?</h4>
		<p class="why-text">
			DevPulse runs AI locally on your machine. But some tasks benefit from cloud AI:
			complex code analysis, long documents, or when your local model is busy.
			API keys let DevPulse escalate to cloud providers when needed.
			<strong>No key = fully local. Always.</strong>
		</p>
		{#if tooltipVisible === "why"}
			<div class="tooltip">The escalation chain: Local Brain → Voice Brain → Claude API → OpenAI → Google. Each tier only activates if the previous one can't handle the request. You control which tiers are enabled.</div>
		{/if}
	</div>
</div>

<style>
	.panel { display:flex;flex-direction:column;gap:1rem;overflow-y:auto;flex:1;padding:0.25rem; }

	.panel-header { display:flex;align-items:flex-start;gap:0.75rem;color:oklch(0.65 0.17 185); }
	.header-text { flex:1; }
	.title { font-size:1.125rem;font-weight:800;color:oklch(0.93 0.015 224);margin:0; }
	.subtitle { font-size:0.8125rem;color:oklch(0.55 0.02 220);margin:0.25rem 0 0; }

	/* Security note */
	.security-note { display:flex;align-items:center;gap:0.5rem;padding:0.625rem 0.875rem;border-radius:0.5rem;background:oklch(0.15 0.04 152/0.15);border:1px solid oklch(0.72 0.19 152/0.25);color:oklch(0.65 0.12 152);font-size:0.8125rem;position:relative; }

	/* Provider card */
	.provider-card { background:oklch(0.12 0.025 220/0.65);border:1px solid oklch(0.3 0.03 220/0.4);border-radius:0.75rem;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;backdrop-filter:blur(12px);transition:border-color 150ms,box-shadow 150ms; }
	.provider-card.stored { border-color:oklch(0.65 0.17 185/0.4);box-shadow:0 0 0.75rem oklch(0.65 0.17 185/0.15); }

	.prov-header { display:flex;align-items:flex-start;gap:0.75rem; }
	.prov-icon { flex-shrink:0;margin-top:0.125rem; }
	.prov-info { flex:1;min-width:0; }
	.prov-name { display:block;font-size:0.9375rem;font-weight:700;color:oklch(0.93 0.015 224); }
	.prov-desc { display:block;font-size:0.8125rem;color:oklch(0.55 0.02 220);margin-top:0.125rem; }
	.prov-status { flex-shrink:0; }

	/* Status badges */
	.status-badge { display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.625rem;border-radius:9999px;font-size:0.875rem;font-weight:600; }
	.stored-badge { background:oklch(0.25 0.08 152/0.3);color:oklch(0.72 0.19 152); }
	.empty-badge { background:oklch(0.2 0.02 220/0.3);color:oklch(0.5 0.02 220); }

	/* Key info */
	.key-info { display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;background:oklch(0.15 0.02 220/0.5);border-radius:0.5rem; }
	.key-masked { flex:1;font-family:monospace;font-size:0.8125rem;color:oklch(0.6 0.02 220);letter-spacing:0.05em; }
	.key-actions { display:flex;gap:0.375rem;position:relative; }

	/* Add key button */
	.add-key-btn { display:inline-flex;align-items:center;gap:0.375rem;padding:0.5rem 1rem;border-radius:0.5rem;border:1px dashed oklch(0.35 0.06 185/0.4);background:oklch(0.12 0.025 185/0.1);color:oklch(0.65 0.12 185);font-size:0.875rem;font-weight:600;cursor:pointer;align-self:flex-start;transition:border-color 100ms; }
	.add-key-btn:hover { border-color:oklch(0.65 0.17 185/0.6);background:oklch(0.15 0.04 185/0.15); }

	/* Edit section */
	.edit-section { display:flex;flex-direction:column;gap:0.5rem; }
	.input-row { display:flex;gap:0.375rem; }
	.key-input { flex:1;padding:0.625rem 0.875rem;border-radius:0.5rem;border:1px solid oklch(0.3 0.03 220/0.4);background:oklch(0.1 0.02 220/0.6);color:oklch(0.93 0.015 224);font-size:0.875rem;font-family:monospace;outline:none; }
	.key-input::placeholder { color:oklch(0.4 0.02 220); }
	.key-input:focus { border-color:oklch(0.65 0.17 185); }
	.help-text { font-size:0.875rem;color:oklch(0.5 0.02 220);margin:0; }
	.edit-actions { display:flex;gap:0.5rem; }

	/* Why section */
	.why-section { padding:0.75rem;border-radius:0.5rem;background:oklch(0.1 0.015 220/0.4);border:1px solid oklch(0.25 0.02 220/0.3);position:relative; }
	.why-title { font-size:0.875rem;font-weight:700;color:oklch(0.7 0.02 220);margin:0 0 0.25rem; }
	.why-text { font-size:0.8125rem;color:oklch(0.55 0.02 220);margin:0;line-height:1.5; }
	.why-text strong { color:oklch(0.72 0.19 152); }

	/* Buttons */
	.btn-accent { display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:0.5rem;border:none;background:oklch(0.65 0.17 185);color:oklch(0.12 0.02 220);font-size:0.8125rem;font-weight:700;cursor:pointer; }
	.btn-accent:hover { filter:brightness(1.15); }
	.btn-accent:disabled { opacity:0.4;cursor:not-allowed; }
	.btn-outline-sm { display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.625rem;border-radius:0.375rem;border:1px solid oklch(0.3 0.03 220/0.4);background:transparent;color:oklch(0.65 0.02 220);font-size:0.875rem;cursor:pointer;position:relative; }
	.btn-outline-sm:hover { background:oklch(0.18 0.015 220/0.3); }
	.btn-delete-sm { display:inline-flex;align-items:center;padding:0.25rem;border-radius:0.375rem;border:1px solid oklch(0.4 0.12 25/0.3);background:transparent;color:oklch(0.6 0.15 25);cursor:pointer;position:relative; }
	.btn-delete-sm:hover { background:oklch(0.2 0.08 25/0.2); }
	.btn-icon { background:none;border:1px solid oklch(0.3 0.02 220/0.4);border-radius:0.375rem;color:oklch(0.55 0.02 220);cursor:pointer;padding:0.375rem; }

	/* States */
	.center { display:flex;align-items:center;gap:0.5rem;justify-content:center;padding:1rem;font-size:0.875rem;color:oklch(0.6 0.02 220); }
	.error-box { padding:0.75rem;border-radius:0.5rem;background:oklch(0.2 0.08 25/0.25);border:1px solid oklch(0.6 0.22 25/0.4);color:oklch(0.8 0.12 25);font-size:0.875rem; }
	.success-box { display:flex;align-items:center;gap:0.5rem;padding:0.625rem 0.875rem;border-radius:0.5rem;background:oklch(0.15 0.05 152/0.15);border:1px solid oklch(0.72 0.19 152/0.3);color:oklch(0.72 0.19 152);font-size:0.8125rem; }

	/* Tooltip */
	.tooltip { position:absolute;z-index:40;bottom:calc(100% + 0.5rem);left:50%;transform:translateX(-50%);white-space:normal;max-width:20rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:oklch(0.08 0.02 220);border:1px solid oklch(0.3 0.03 220/0.5);color:oklch(0.8 0.015 224);font-size:0.875rem;line-height:1.4;box-shadow:0 4px 12px oklch(0 0 0/0.4);pointer-events:none; }
</style>
