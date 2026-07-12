<!--
	@feature DownloaderTokenStrip
	@module @devpulse/domains/app/models/feature/downloader/feature

	HuggingFace token row — shown at the top of the downloader overlay
	above the active phase panel. Two modes:

	  - No token stored — input + Save button + layman help paragraph.
	  - Token stored — masked indicator (last 4 chars), Clear button.

	Side-effects live in `modelDownloaderState` (`saveToken` /
	`clearToken` / `refreshTokenStatus`). The strip never touches Tauri
	directly.

	ARIA:
	  - Input has `type="password"` so OS-level password managers
	    treat the token like a secret.
	  - Buttons carry explicit `aria-label` from the copy block.
	  - The stored-suffix line has `role="status"` `aria-live="polite"`
	    so AT users hear the confirmation when a token saves.
-->
<script lang="ts">
import { Check, Key } from "lucide-svelte";
import { cn } from "$lib/design/utils/cn.js";
import type { DownloaderCopy } from "$lib/sys/generated/bindings.js";
import { modelDownloaderState } from "../data-access/downloader.state.svelte.js";

interface Props {
	copy: DownloaderCopy;
	class?: string;
}

let { copy, class: className }: Props = $props();

let draftToken = $state("");
let saving = $state(false);

async function handleSave(): Promise<void> {
	if (saving) return;
	saving = true;
	try {
		await modelDownloaderState.saveToken(draftToken);
		draftToken = "";
	} finally {
		saving = false;
	}
}

async function handleClear(): Promise<void> {
	await modelDownloaderState.clearToken();
}

function formatSuffix(suffix: string | null): string {
	if (!suffix) return "";
	return copy.token_stored_template.replace("{suffix}", suffix);
}
</script>

<section class={cn("token-strip", className)} aria-labelledby="downloader-token-heading">
	<h3 id="downloader-token-heading" class="token-strip__heading">
		<Key class="token-strip__icon" aria-hidden="true" />
		{copy.token_section_heading}
	</h3>

	{#if modelDownloaderState.tokenStatus.stored}
		<div class="token-strip__stored" role="status" aria-live="polite">
			<Check class="token-strip__check" aria-hidden="true" />
			<span>{formatSuffix(modelDownloaderState.tokenStatus.suffix)}</span>
			<button
				type="button"
				class="token-strip__clear"
				aria-label={copy.token_clear_aria}
				onclick={handleClear}
			>
				{copy.token_clear_label}
			</button>
		</div>
	{:else}
		<div class="token-strip__entry">
			<input
				type="password"
				class="token-strip__input"
				placeholder={copy.token_input_placeholder}
				bind:value={draftToken}
				autocomplete="off"
				spellcheck="false"
			/>
			<button
				type="button"
				class="token-strip__save"
				aria-label={copy.token_save_aria}
				disabled={saving || draftToken.trim().length === 0}
				onclick={handleSave}
			>
				{copy.token_save_label}
			</button>
		</div>
		<p class="token-strip__help">{copy.token_help}</p>
	{/if}
</section>

<style>
	.token-strip {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding: var(--space-12) var(--space-14);
		border-radius: var(--radius-md);
		background: var(--surface-inset);
		border: 0.0625rem solid var(--border-subtle);
	}

	.token-strip__heading {
		display: inline-flex;
		align-items: center;
		gap: var(--space-7);
		margin: 0;
		font-size: var(--space-12);
		font-weight: 600;
		color: var(--text-primary);
	}

	.token-strip__icon {
		width: var(--space-14);
		height: var(--space-14);
		color: var(--accent-purple-main);
	}

	.token-strip__stored {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		font-size: var(--space-12);
		color: var(--accent-teal-main);
	}

	.token-strip__check {
		width: var(--space-12);
		height: var(--space-12);
	}

	.token-strip__clear {
		margin-left: auto;
		padding: var(--space-5) var(--space-10);
		border-radius: var(--radius-sm);
		background: transparent;
		border: 0.0625rem solid var(--border-subtle);
		color: var(--text-secondary);
		font-size: var(--space-11);
		cursor: pointer;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.token-strip__clear:hover {
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.token-strip__clear:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}

	.token-strip__entry {
		display: flex;
		gap: var(--space-8);
	}

	.token-strip__input {
		flex: 1;
		min-width: 0;
		padding: var(--space-8) var(--space-10);
		border-radius: var(--radius-sm);
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-subtle);
		color: var(--text-primary);
		font-size: var(--space-12);
		font-family: var(--font-mono);
	}

	.token-strip__input:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}

	.token-strip__save {
		padding: var(--space-8) var(--space-14);
		border-radius: var(--radius-sm);
		background: var(--accent-purple-fill);
		border: 0.0625rem solid var(--accent-purple-main);
		color: var(--accent-purple-main);
		font-size: var(--space-12);
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.token-strip__save:hover:not(:disabled) {
		opacity: 0.85;
	}

	.token-strip__save:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.token-strip__save:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}

	.token-strip__help {
		margin: 0;
		font-size: var(--space-11);
		color: var(--text-muted);
		line-height: 1.5;
	}
</style>
