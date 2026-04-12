<!--
  @file HfTokenModal.svelte
  @domain models/setup-wizard

  Modal for entering / clearing the HuggingFace access token.

  - Password input, save / clear / cancel / X-close
  - WAI-ARIA dialog pattern (role="dialog", aria-modal, focus trap,
    Escape dismiss, click-outside dismiss)
  - Copy strings come from `copy.hf_token.*` — zero hardcoded user text
  - Never stores the plaintext token in any rune or component state
    after save; we only surface the has-token boolean back to callers
  - Uses the same `commands` binding the rest of the overlay uses

  Parent contract:
    interface Props {
      open: boolean
      copy: HfTokenCopy
      initiallyHasToken: boolean
      onClose: () => void
      onSaved: (hasToken: boolean) => void
    }
-->
<script lang="ts">
import { ExternalLink, X } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";
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

// Snapshot the previously-focused element when the modal opens so we
// can restore focus on close (APG dialog pattern).
let returnFocusEl: HTMLElement | null = null;

$effect(() => {
	if (!open) {
		token = "";
		error = null;
		returnFocusEl?.focus?.();
		returnFocusEl = null;
		return;
	}
	// On open
	openedAt = Date.now();
	returnFocusEl = (document.activeElement as HTMLElement | null) ?? null;
	// Focus the first interactive element in the next tick so the dialog
	// has mounted. Svelte 5 $effect runs after render — the dialogEl ref
	// is already bound.
	queueMicrotask(() => {
		firstFocusEl?.focus?.();
	});
});

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
		const result = await commands.setHfToken(token);
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
		const result = await commands.clearHfToken();
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
				<Button preset="ghost" size="sm" onclick={onClose} aria-label={copy.close_aria}>
					<X size={16} aria-hidden="true" />
				</Button>
			</div>

			<Text id="hf-token-desc" size="sm" color="secondary">{copy.subtitle}</Text>

			<label class="field">
				<Text size="xs" weight="bold" color="muted">{copy.field_label}</Text>
				<input
					bind:this={firstFocusEl}
					type="password"
					class="token-input"
					placeholder={copy.field_placeholder}
					bind:value={token}
					autocomplete="off"
					spellcheck="false"
					disabled={saving}
				/>
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
					preset="secondary"
					size="md"
					onclick={onClose}
					disabled={saving}
				>
					{copy.cancel_label}
				</Button>
				{#if initiallyHasToken}
					<Button
						preset="danger"
						size="md"
						onclick={handleClear}
						disabled={saving}
						aria-label={copy.clear_aria}
					>
						{copy.clear_label}
					</Button>
				{/if}
				<Button
					preset="primary"
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

	.token-input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border-radius: var(--radius-md, 0.5rem);
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		background: var(--surface-inset, #080d18);
		color: var(--text-primary, #e6eaf3);
		font-family: var(--font-family-mono, ui-monospace, monospace);
		font-size: 0.875rem;
		transition: border-color var(--motion-duration-fast, 150ms);
	}
	.token-input:focus {
		outline: none;
		border-color: var(--accent-cyan-main, #58c4e6);
	}
	.token-input:disabled {
		opacity: 0.6;
		cursor: wait;
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
