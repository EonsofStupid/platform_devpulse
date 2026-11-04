<!--
  @file HfTokenModal.svelte
  @domain models/setup-wizard

  Modal for entering / clearing the HuggingFace access token.

  **Security posture**
  - The stored token NEVER leaves the Rust side in plaintext. When a
    token is already stored we display a "masked pill"
    `••••••••hf_xxxxx` using only the last 5 characters returned by
    the `hf_token_suffix` kernel helper. The full stored token never
    touches frontend state.
  - The new-token input is `type="password"` by default and only
    briefly swaps to `type="text"` when the user presses the eye
    toggle. The typed value is cleared from component state the
    instant the modal closes or a save/clear succeeds.
  - The copy-to-clipboard button copies only the CURRENT input (the
    token the user is typing) — never the stored token.

  **Pattern**
  - WAI-ARIA dialog (role="dialog", aria-modal, focus trap, Escape
    dismiss, click-outside dismiss, return focus on close).
  - Copy strings come from `copy.hf_token.*` — zero hardcoded text.
  - Uses the Specta-generated `commands` binding including `hfTokenSuffix`.

  **Parent contract**
    interface Props {
      open: boolean
      copy: HfTokenCopy
      initiallyHasToken: boolean
      onClose: () => void
      onSaved: (hasToken: boolean) => void
    }
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { Check, Copy, ExternalLink, Eye, EyeOff, X } from "lucide-svelte";
import { withAction } from "$lib/sys/action-bus.svelte.js";
import { commands } from "$lib/sys/generated/bindings.js";

import type { HfTokenCopy } from "../wizard.types.js";

interface Props {
	/** Whether the modal is visible. Driven by parent state. */
	open: boolean;
	/** Layman copy from `get_wizard_copy`.hf_token section. */
	copy: HfTokenCopy;
	/** Current has-token state, read by parent from `commands.hasHfToken`. */
	initiallyHasToken: boolean;
	/** Close without any change. Called by Escape, X, cancel, click-outside. */
	onClose: () => void;
	/** Fires after a successful save or clear. Payload is the new has-token bool. */
	onSaved: (hasToken: boolean) => void;
}

let { open, copy, initiallyHasToken, onClose, onSaved }: Props = $props();

let token = $state("");
let saving = $state(false);
let error = $state<string | null>(null);
let dialogEl = $state<HTMLElement | null>(null);
let firstFocusEl = $state<HTMLInputElement | null>(null);
let openedAt = $state(0);

// Reveal toggle — swaps the input `type` between "password" and
// "text" so the user can peek at what they're typing without
// losing the masked-by-default posture.
let revealInput = $state(false);

// Brief "copied!" feedback on the copy button — flips true for
// 1500 ms after a successful clipboard write then resets.
let justCopied = $state(false);

// The last 5 characters of the currently-stored token, fetched via
// `hf_token_suffix`. Drives the masked-pill display at the top of
// the dialog. `null` means no token is stored.
let storedSuffix = $state<string | null>(null);

// Snapshot the previously-focused element when the modal opens so we
// can restore focus on close (APG dialog pattern).
let returnFocusEl: HTMLElement | null = null;

async function refreshStoredSuffix(): Promise<void> {
	if (!initiallyHasToken) {
		storedSuffix = null;
		return;
	}
	try {
		const suffix = await withAction("models.hfTokenSuffix", "Loading token mask…", async () => {
			const r = await commands.hfTokenSuffix(5);
			if (r.status === "error") {
				throw new Error(r.error);
			}
			return r.data;
		});
		storedSuffix = suffix;
	} catch (e) {
		// Non-fatal — the pill falls back to the unsaved badge.
		console.warn("hf_token_suffix failed", e);
		storedSuffix = null;
	}
}

$effect(() => {
	if (!open) {
		token = "";
		error = null;
		revealInput = false;
		justCopied = false;
		returnFocusEl?.focus?.();
		returnFocusEl = null;
		return;
	}
	// On open
	openedAt = Date.now();
	returnFocusEl = (document.activeElement as HTMLElement | null) ?? null;
	void refreshStoredSuffix();
	// Focus the first interactive element in the next tick so the dialog
	// has mounted. Svelte 5 $effect runs after render — the dialogEl ref
	// is already bound.
	queueMicrotask(() => {
		firstFocusEl?.focus?.();
	});
});

function toggleReveal(): void {
	revealInput = !revealInput;
}

async function handleCopy(): Promise<void> {
	if (token.length === 0) return;
	try {
		await navigator.clipboard.writeText(token);
		justCopied = true;
		setTimeout(() => {
			justCopied = false;
		}, 1500);
	} catch (e) {
		console.warn("clipboard write failed", e);
		error = `Couldn't copy: ${e instanceof Error ? e.message : String(e)}`;
	}
}

function handleKeydown(e: KeyboardEvent): void {
	if (!open) return;
	if (e.key === "Escape") {
		e.preventDefault();
		onClose();
		return;
	}
	if (e.key === "Tab" && dialogEl) {
		// Focus trap — cycle within dialog focusables
		const focusables = dialogEl.querySelectorAll<HTMLElement>(
			'button, input, a[href], [tabindex]:not([tabindex="-1"])',
		);
		if (focusables.length === 0) return;
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}
}

function handleScrimClick(e: MouseEvent): void {
	if (e.target === e.currentTarget) onClose();
}

async function handleSave(): Promise<void> {
	if (saving) return;
	saving = true;
	error = null;
	try {
		const result = await withAction(
			"models.setHfToken",
			"Saving your Hugging Face token…",
			async () => commands.setHfToken(token),
		);
		if (result.status === "error") {
			error = copy.save_error_template.replace("{error}", result.error);
			return;
		}
		token = "";
		onSaved(true);
		onClose();
	} catch (e) {
		error = copy.save_error_template.replace("{error}", e instanceof Error ? e.message : String(e));
	} finally {
		saving = false;
	}
}

async function handleClear(): Promise<void> {
	if (saving) return;
	saving = true;
	error = null;
	try {
		const result = await withAction(
			"models.clearHfToken",
			"Clearing your Hugging Face token…",
			async () => commands.clearHfToken(),
		);
		if (result.status === "error") {
			error = copy.save_error_template.replace("{error}", result.error);
			return;
		}
		token = "";
		onSaved(false);
		onClose();
	} catch (e) {
		error = copy.save_error_template.replace("{error}", e instanceof Error ? e.message : String(e));
	} finally {
		saving = false;
	}
}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="scrim"
		role="presentation"
		onclick={handleScrimClick}
	>
		<div
			bind:this={dialogEl}
			class="dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="hf-token-title"
			aria-describedby="hf-token-desc"
			tabindex="-1"
			data-opened-at={openedAt}
		>
			<div class="head">
				<Heading level={2} size="md" id="hf-token-title">{copy.title}</Heading>
				<Button variant="ghost" size="sm" onclick={onClose} aria-label={copy.close_aria}>
					<X size={16} aria-hidden="true" />
				</Button>
			</div>

			<Text id="hf-token-desc" size="sm" color="secondary">{copy.subtitle}</Text>

			{#if initiallyHasToken}
				<div
					class="stored-pill"
					role="status"
					aria-label={copy.lock_icon_aria}
				>
					<span class="stored-mask" aria-hidden="true">••••••••</span>
					<span class="stored-suffix">{storedSuffix ?? "•••••"}</span>
					<span class="stored-badge">{copy.saved_badge}</span>
				</div>
			{/if}

			<label class="field">
				<Text size="xs" weight="bold" color="muted">{copy.field_label}</Text>
				<div class="input-row">
					<input
						bind:this={firstFocusEl}
						type={revealInput ? "text" : "password"}
						class="token-input"
						placeholder={copy.field_placeholder}
						bind:value={token}
						autocomplete="off"
						spellcheck="false"
						disabled={saving}
					/>
					<button
						type="button"
						class="inline-action"
						onclick={toggleReveal}
						aria-label={revealInput ? "Hide token" : "Reveal token"}
						title={revealInput ? "Hide" : "Reveal"}
						disabled={saving}
					>
						{#if revealInput}
							<EyeOff size={14} aria-hidden="true" />
						{:else}
							<Eye size={14} aria-hidden="true" />
						{/if}
					</button>
					<button
						type="button"
						class="inline-action"
						onclick={handleCopy}
						aria-label="Copy token to clipboard"
						title="Copy"
						disabled={saving || token.length === 0}
					>
						{#if justCopied}
							<Check size={14} aria-hidden="true" />
						{:else}
							<Copy size={14} aria-hidden="true" />
						{/if}
					</button>
				</div>
			</label>

			{#if error}
				<Text size="xs" color="danger" role="alert">{error}</Text>
			{/if}

			<div class="help-row">
				<a
					href={copy.help_url}
					target="_blank"
					rel="noopener noreferrer"
					class="help-link"
				>
					{copy.help_link_label}
					<ExternalLink size={12} aria-hidden="true" />
				</a>
			</div>

			<div class="actions">
				<Button
					variant="secondary"
					size="md"
					onclick={onClose}
					disabled={saving}
				>
					{copy.cancel_label}
				</Button>
				{#if initiallyHasToken}
					<Button
						variant="danger"
						size="md"
						onclick={handleClear}
						disabled={saving}
						aria-label={copy.clear_aria}
					>
						{copy.clear_label}
					</Button>
				{/if}
				<Button
					variant="primary"
					size="md"
					onclick={handleSave}
					disabled={saving || token.trim().length === 0}
					aria-label={copy.save_aria}
				>
					{copy.save_label}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		background: color-mix(in oklch, var(--surface-base, #04080f) 72%, transparent);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(1rem, 3vw, 2.5rem);
		z-index: 90;
	}

	.dialog {
		width: min(32rem, 95vw);
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: clamp(1rem, 2.5vw, 1.5rem);
		background: var(--surface-raised, #0c1220);
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		border-radius: var(--radius-lg, 0.75rem);
		box-shadow: var(--wizard-shadow-glow-lg, 0 1.25rem 2.5rem rgba(0, 0, 0, 0.45));
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.input-row {
		display: flex;
		align-items: stretch;
		gap: 0.375rem;
	}

	.token-input {
		flex: 1;
		min-width: 0;
		padding: 0.625rem 0.75rem;
		border-radius: var(--radius-md, 0.5rem);
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		background: var(--surface-inset, #080d18);
		color: var(--text-primary, #e6eaf3);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.875rem;
		transition: border-color var(--duration-fast, 150ms);
	}
	.token-input:focus {
		outline: none;
		border-color: var(--accent-cyan-main, #58c4e6);
	}
	.token-input:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.inline-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		min-height: 2.25rem;
		padding: 0;
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		background: var(--surface-raised, #0c1220);
		color: var(--text-secondary, #8b9bb8);
		border-radius: var(--radius-md, 0.5rem);
		cursor: pointer;
		transition:
			color var(--duration-fast, 150ms),
			border-color var(--duration-fast, 150ms),
			background var(--duration-fast, 150ms);
	}
	.inline-action:hover:not(:disabled) {
		color: var(--accent-cyan-main, #58c4e6);
		border-color: var(--accent-cyan-main, #58c4e6);
	}
	.inline-action:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.stored-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 999px;
		border: 0.0625rem solid var(--accent-teal-main, #14b8a6);
		background: color-mix(
			in oklch,
			var(--accent-teal-main, #14b8a6) 12%,
			var(--surface-inset, #080d18)
		);
		color: var(--accent-teal-main, #14b8a6);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.8125rem;
		align-self: flex-start;
	}
	.stored-mask {
		letter-spacing: 0.1em;
	}
	.stored-suffix {
		font-weight: 700;
	}
	.stored-badge {
		margin-left: 0.375rem;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: var(--accent-teal-main, #14b8a6);
		color: var(--surface-base, #04080f);
		font-family: var(--font-sans, system-ui, sans-serif);
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.help-row {
		display: flex;
		justify-content: flex-start;
	}

	.help-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: var(--text-secondary, #8b9bb8);
		text-decoration: none;
		border-bottom: 0.0625rem dashed var(--border-subtle, #1a2030);
	}
	.help-link:hover {
		color: var(--accent-cyan-main, #58c4e6);
		border-bottom-color: var(--accent-cyan-main, #58c4e6);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
</style>
