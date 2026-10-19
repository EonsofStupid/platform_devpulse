<!--
	@component HfTokenPanel
	@module sys/debug

	The HuggingFace token devtool: shows whether a token is stored, and saves,
	reveals, clears and re-checks it. Rust owns the token; only the `has-token`
	boolean lives here. Shown inside ColdLight's token debugger (Ctrl+Shift+D),
	which the root layout passes it into: ColdLight imports nothing from the app.
	Colours come from the wizard role and accent tokens; no raw values.
-->
<script lang="ts">
import { onMount } from "svelte";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

// ── HF Token devtool panel ─────────────────────────────────
// Private tool. Private to dev mode. Hidden behind Ctrl+Shift+D until
// the eye button below toggles visibility OR the user reveals the raw
// value. Rust is the owner — we never cache the token in frontend
// state. Only the `has-token` boolean lives here.
let hfTokenHas = $state<boolean | null>(null);
let hfTokenReveal = $state(false);
let hfTokenInput = $state("");
let hfTokenBusy = $state(false);
let hfTokenError = $state<string | null>(null);

async function refreshHfTokenState(): Promise<void> {
	try {
		const result = await commands.hasHfToken();
		if (result.status === "ok") hfTokenHas = result.data;
	} catch (e) {
		hfTokenError = e instanceof Error ? e.message : String(e);
	}
}

async function saveHfToken(): Promise<void> {
	if (hfTokenBusy || hfTokenInput.trim().length === 0) return;
	hfTokenBusy = true;
	hfTokenError = null;
	logInfo("token-devtool", "set_hf_token dispatched");
	try {
		const result = await commands.setHfToken(hfTokenInput);
		if (result.status === "error") {
			hfTokenError = result.error;
			logError("token-devtool", `set_hf_token failed: ${result.error}`);
			return;
		}
		hfTokenInput = "";
		await refreshHfTokenState();
		logInfo("token-devtool", "set_hf_token ok");
	} catch (e) {
		hfTokenError = e instanceof Error ? e.message : String(e);
	} finally {
		hfTokenBusy = false;
	}
}

async function clearHfToken(): Promise<void> {
	if (hfTokenBusy) return;
	hfTokenBusy = true;
	hfTokenError = null;
	logInfo("token-devtool", "clear_hf_token dispatched");
	try {
		const result = await commands.clearHfToken();
		if (result.status === "error") {
			hfTokenError = result.error;
			logError("token-devtool", `clear_hf_token failed: ${result.error}`);
			return;
		}
		hfTokenInput = "";
		await refreshHfTokenState();
		logInfo("token-devtool", "clear_hf_token ok");
	} catch (e) {
		hfTokenError = e instanceof Error ? e.message : String(e);
	} finally {
		hfTokenBusy = false;
	}
}

// The debugger mounts this panel when it opens; re-check the token then.
onMount(() => {
	void refreshHfTokenState();
});
</script>

<div class="hf-token-panel">
	<div class="hf-token-header">
		<span class="hf-token-title">HF TOKEN</span>
		<span class="hf-token-status" class:hf-token-status-set={hfTokenHas === true}>
			{hfTokenHas === null ? "checking..." : hfTokenHas ? "STORED" : "EMPTY"}
		</span>
	</div>

	<div class="hf-token-input-row">
		<input
			type={hfTokenReveal ? "text" : "password"}
			placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
			bind:value={hfTokenInput}
			disabled={hfTokenBusy}
			autocomplete="off"
			spellcheck="false"
			class="hf-token-input"
		/>
		<button
			type="button"
			onclick={() => (hfTokenReveal = !hfTokenReveal)}
			title={hfTokenReveal ? "Hide" : "Reveal"}
			class="hf-token-reveal-btn"
		>
			{hfTokenReveal ? "🙈" : "👁"}
		</button>
	</div>

	<div class="hf-token-actions">
		<button
			type="button"
			onclick={saveHfToken}
			disabled={hfTokenBusy || hfTokenInput.trim().length === 0}
			class="hf-token-btn hf-token-btn-save"
		>
			Save
		</button>
		<button
			type="button"
			onclick={clearHfToken}
			disabled={hfTokenBusy || hfTokenHas !== true}
			class="hf-token-btn hf-token-btn-clear"
		>
			Clear
		</button>
		<button
			type="button"
			onclick={refreshHfTokenState}
			disabled={hfTokenBusy}
			class="hf-token-btn hf-token-btn-refresh"
		>
			↻
		</button>
	</div>

	{#if hfTokenError}
		<div class="hf-token-error">{hfTokenError}</div>
	{/if}
</div>

<style>
	/* HF Token devtool panel — token-driven styling.
	   Every value references a DTCG token the wizard already owns. */
	.hf-token-panel {
		padding: var(--space-3);
		border-bottom: var(--border-width-thin) solid var(--accent-teal-main);
		background: var(--accent-teal-fill);
	}

	.hf-token-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-2);
	}

	.hf-token-title {
		font-size: var(--font-size-sm);
		font-weight: 700;
		color: var(--accent-teal-main);
	}

	.hf-token-status {
		font-size: var(--font-size-xs);
		font-weight: 700;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-full);
		border: var(--border-width-thin) solid var(--border-subtle);
		color: var(--text-secondary);
	}
	.hf-token-status-set {
		border-color: var(--accent-teal-main);
		color: var(--accent-teal-main);
	}

	.hf-token-input-row {
		display: flex;
		gap: var(--space-1);
		align-items: stretch;
		margin-bottom: var(--space-2);
	}

	.hf-token-input {
		flex: 1;
		padding: var(--space-2);
		font-family: var(--font-family-mono);
		font-size: var(--font-size-xs);
		background: var(--surface-inset);
		color: var(--text-primary);
		border: var(--border-width-thin) solid var(--border-subtle);
		border-radius: var(--radius-sm);
	}
	.hf-token-input:focus {
		outline: none;
		border-color: var(--accent-teal-main);
	}
	.hf-token-input:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.hf-token-reveal-btn {
		padding: var(--space-2);
		background: var(--surface-raised);
		border: var(--border-width-thin) solid var(--border-subtle);
		border-radius: var(--radius-sm);
		color: var(--accent-teal-main);
		cursor: pointer;
		font-size: var(--font-size-sm);
	}
	.hf-token-reveal-btn:hover {
		border-color: var(--accent-teal-main);
	}

	.hf-token-actions {
		display: flex;
		gap: var(--space-1);
	}

	.hf-token-btn {
		flex: 1;
		padding: var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: var(--font-size-xs);
		cursor: pointer;
		border: var(--border-width-thin) solid transparent;
	}
	.hf-token-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.hf-token-btn-save {
		background: var(--accent-teal-fill);
		border-color: var(--accent-teal-main);
		color: var(--accent-teal-main);
	}
	.hf-token-btn-save:hover:not(:disabled) {
		background: var(--accent-teal-main);
		color: var(--text-on-accent);
	}

	.hf-token-btn-clear {
		background: var(--signal-error-fill);
		border-color: var(--signal-error-main);
		color: var(--signal-error-main);
	}
	.hf-token-btn-clear:hover:not(:disabled) {
		background: var(--signal-error-main);
		color: var(--text-on-accent);
	}

	.hf-token-btn-refresh {
		flex: 0 0 auto;
		background: var(--surface-raised);
		border-color: var(--border-subtle);
		color: var(--text-secondary);
	}
	.hf-token-btn-refresh:hover:not(:disabled) {
		color: var(--text-primary);
		border-color: var(--accent-teal-main);
	}

	.hf-token-error {
		margin-top: var(--space-2);
		padding: var(--space-2);
		background: var(--signal-error-fill);
		border: var(--border-width-thin) solid var(--signal-error-main);
		border-radius: var(--radius-sm);
		color: var(--signal-error-main);
		font-size: var(--font-size-xs);
	}
</style>
