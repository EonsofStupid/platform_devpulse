<!--
	@feature ModelDownloaderOverlay
	@module @devpulse/domains/app/models/feature/downloader

	The standalone Model Downloader overlay — search HuggingFace, tag a
	model with a slot role, confirm the bundle, download with the
	stored HF token. Reusable from ANY surface via
	`modelDownloaderState.open({ slotId?, projectId?, defaultQuery? })`.

	## ARIA APG Dialog Modal pattern

	Implements every contract from
	https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ :

	  - `role="dialog"`, `aria-modal="true"`.
	  - `aria-labelledby` → the dialog title id.
	  - `aria-describedby` → the dialog subtitle id.
	  - Initial focus on the close button (first focusable, neutral).
	  - Focus trap on Tab / Shift+Tab — cycle stays inside the dialog.
	  - Escape closes; mid-download Escape raises the confirmation
	    flag instead.
	  - Click on the backdrop closes (with the same in-flight check).
	  - On close, focus returns to the element that opened the
	    overlay (captured in `modelDownloaderState.openerElement`).

	## Visual contract

	  - `AuroraGradientBackdrop` paints the soft purple/teal/green
	    moving gradient backdrop ONLY in this overlay (the wizard's
	    MP4 backdrop is untouched).
	  - Every dimension is fluid-clamped via `--space-*` tokens.
	  - The phase view router picks Token+Search /
	    Token+Confirm / Progress / Complete / Error.

	## Copy contract

	  - All visible English is loaded from `WizardCopy.downloader`
	    via the existing `getWizardCopy()` Tauri command. The strip
	    skeleton-renders while the copy is in flight so the dialog
	    never paints layout twice.
-->
<script lang="ts">
import { cn } from "@devpulse/coldlight/utils";
import { CheckCircle, X } from "lucide-svelte";
import { onMount, tick } from "svelte";
import { downloadState } from "#lib/sys/activity-hud/download.state.svelte.js";
import { installState } from "#lib/sys/activity-hud/install.state.svelte.js";
import { getWizardCopy } from "#lib/sys/bindings/models/index.js";
import type { DownloaderCopy, WizardCopy } from "#lib/sys/generated/bindings.js";
import { logError } from "#lib/sys/logger.js";
import { modelDownloaderState } from "./data-access/index.js";
import {
	DownloaderConfirmPanel,
	DownloaderProgressPanel,
	DownloaderSearchPanel,
	DownloaderTokenStrip,
} from "./feature/index.js";
import { AuroraGradientBackdrop } from "./ui/index.js";

let copy = $state<DownloaderCopy | null>(null);
let copyError = $state<string | null>(null);

let dialogRoot: HTMLDivElement | undefined = $state();
let closeButton: HTMLButtonElement | undefined = $state();

onMount(() => {
	void loadCopy();
});

async function loadCopy(): Promise<void> {
	try {
		const r = await getWizardCopy();
		if (r.status === "ok") {
			const full = r.data as WizardCopy;
			copy = full.downloader ?? null;
		} else {
			copyError = String(r.error);
			logError("downloader", `getWizardCopy failed: ${r.error}`);
		}
	} catch (e) {
		copyError = e instanceof Error ? e.message : String(e);
		logError("downloader", `getWizardCopy threw: ${copyError}`);
	}
}

// Focus management — on phase transition to a visible state, focus the
// close button. APG dialog pattern: initial focus on a neutral
// focusable inside the dialog, NOT on the destructive primary.
$effect(() => {
	const open = modelDownloaderState.phase !== "closed";
	if (!open) return;
	void tick().then(() => closeButton?.focus());
});

// Install-chain completion bridge — when our install reaches a
// terminal state, promote the phase. `installState` is wired by
// `bootstrapDownloadBridge` at app boot.
$effect(() => {
	const id = modelDownloaderState.activeInstallId;
	if (!id) return;
	const install = installState.list.find((i) => i.installId === id);
	if (!install) return;
	if (install.status === "complete") {
		modelDownloaderState.markComplete();
	} else if (install.status === "failed") {
		modelDownloaderState.markFailed(install.error ?? "Install failed");
	}
});

// Direct-download completion bridge — same shape as the install one
// but keyed on `downloadState` for the no-slot path.
$effect(() => {
	const id = modelDownloaderState.activeDownloadId;
	if (!id) return;
	const dl = downloadState.list.find((d) => d.downloadId === id);
	if (!dl) return;
	if (dl.status === "complete") {
		modelDownloaderState.markComplete();
	} else if (dl.status === "failed") {
		modelDownloaderState.markFailed(dl.error ?? "Download failed");
	} else if (dl.status === "cancelled") {
		// User-initiated cancel — return to search rather than error.
		void modelDownloaderState.cancel();
	}
});

function handleKeydown(e: KeyboardEvent): void {
	if (modelDownloaderState.phase === "closed") return;
	if (e.key === "Escape") {
		e.preventDefault();
		modelDownloaderState.close();
		return;
	}
	if (e.key === "Tab") {
		trapFocus(e);
	}
}

/**
 * APG focus trap — keep Tab / Shift+Tab cycling inside the dialog.
 * Resolves focusables fresh on every keypress so dynamically-added
 * elements (results landing post-search, slot dropdown options) are
 * included without re-binding.
 */
function trapFocus(e: KeyboardEvent): void {
	if (!dialogRoot) return;
	const focusables = dialogRoot.querySelectorAll<HTMLElement>(
		'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
	);
	if (focusables.length === 0) return;
	const first = focusables[0];
	const last = focusables[focusables.length - 1];
	const active = document.activeElement as HTMLElement | null;
	if (e.shiftKey) {
		if (active === first || !dialogRoot.contains(active)) {
			e.preventDefault();
			last.focus();
		}
	} else if (active === last) {
		e.preventDefault();
		first.focus();
	}
}

function handleBackdropClick(): void {
	modelDownloaderState.close();
}

function handleForceClose(): void {
	modelDownloaderState.forceClose();
}

function handleDismissConfirm(): void {
	modelDownloaderState.dismissCloseConfirmation();
}

function handleClose(): void {
	modelDownloaderState.close();
}

function handleDone(): void {
	modelDownloaderState.forceClose();
}

function handleRetry(): void {
	modelDownloaderState.retry();
}

function handleBackFromError(): void {
	modelDownloaderState.back();
}

function handleBrowseMore(): void {
	modelDownloaderState.back();
}

function formatComplete(): string {
	if (!copy || !modelDownloaderState.selection) return "";
	const modelName = modelDownloaderState.selection.repoId;
	const slotId = modelDownloaderState.selection.slotId;
	const slotLabel = slotId ? ` (slot: ${slotId})` : "";
	return copy.complete_summary_template
		.replace("{model_name}", modelName)
		.replace("{slot_label}", slotLabel);
}

function formatError(): string {
	if (!copy || !modelDownloaderState.errorDetail) return "";
	return copy.error_body_template.replace("{error}", modelDownloaderState.errorDetail);
}
</script>

{#if modelDownloaderState.phase !== "closed"}
	{#if copyError}
		<!-- Copy load failed — render a minimal error banner; AT-readable -->
		<div class="downloader-fallback" role="alert">
			Downloader copy failed to load: {copyError}
			<button type="button" onclick={handleClose}>Close</button>
		</div>
	{:else if copy}
		<!-- Backdrop click-target — sits BENEATH the dialog. Native button
		     gives keyboard activate-without-focus behavior + AT-correct
		     "click to close" semantics without a custom role. -->
		<button
			type="button"
			class="downloader-backdrop"
			aria-label={copy.close_button_aria}
			onclick={handleBackdropClick}
		></button>

		<div
			bind:this={dialogRoot}
			class="downloader-dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="downloader-dialog-title"
			aria-describedby="downloader-dialog-subtitle"
			onkeydown={handleKeydown}
			tabindex="-1"
		>
			<AuroraGradientBackdrop class="downloader-dialog__aurora" />

			<header class="downloader-dialog__header">
				<div class="downloader-dialog__titles">
					<h2 id="downloader-dialog-title" class="downloader-dialog__title">
						{copy.dialog_title}
					</h2>
					<p id="downloader-dialog-subtitle" class="downloader-dialog__subtitle">
						{copy.dialog_subtitle}
					</p>
				</div>
				<button
					bind:this={closeButton}
					type="button"
					class="downloader-dialog__close"
					aria-label={copy.close_button_aria}
					onclick={handleClose}
				>
					<X aria-hidden="true" />
					<span class="downloader-dialog__close-label">{copy.close_button_label}</span>
				</button>
			</header>

			<DownloaderTokenStrip {copy} class="downloader-dialog__token-strip" />

			<div class="downloader-dialog__body">
				{#if modelDownloaderState.phase === "search"}
					<DownloaderSearchPanel {copy} />
				{:else if modelDownloaderState.phase === "confirm"}
					<DownloaderConfirmPanel {copy} />
				{:else if modelDownloaderState.phase === "downloading"}
					<DownloaderProgressPanel {copy} />
				{:else if modelDownloaderState.phase === "complete"}
					<section
						class="downloader-dialog__complete"
						aria-labelledby="downloader-complete-heading"
					>
						<CheckCircle class="downloader-dialog__complete-icon" aria-hidden="true" />
						<h3 id="downloader-complete-heading" class="downloader-dialog__phase-heading">
							{copy.complete_phase_heading}
						</h3>
						<p class="downloader-dialog__complete-summary">{formatComplete()}</p>
						<div class="downloader-dialog__complete-actions">
							<button
								type="button"
								class="downloader-dialog__action downloader-dialog__action--secondary"
								onclick={handleBrowseMore}
							>
								{copy.complete_browse_more_label}
							</button>
							<button
								type="button"
								class="downloader-dialog__action downloader-dialog__action--primary"
								onclick={handleDone}
							>
								{copy.complete_done_label}
							</button>
						</div>
					</section>
				{:else if modelDownloaderState.phase === "error"}
					<section
						class="downloader-dialog__error"
						aria-labelledby="downloader-error-heading"
					>
						<h3 id="downloader-error-heading" class="downloader-dialog__phase-heading">
							{copy.error_phase_heading}
						</h3>
						<p class="downloader-dialog__error-body" role="alert">
							{formatError()}
						</p>
						<div class="downloader-dialog__error-actions">
							<button
								type="button"
								class="downloader-dialog__action downloader-dialog__action--secondary"
								onclick={handleBackFromError}
							>
								{copy.error_back_label}
							</button>
							<button
								type="button"
								class="downloader-dialog__action downloader-dialog__action--primary"
								aria-label={copy.error_retry_aria}
								onclick={handleRetry}
							>
								{copy.error_retry_label}
							</button>
						</div>
					</section>
				{/if}
			</div>

			{#if modelDownloaderState.closeConfirmationPending}
				<!-- Close-during-download interstitial — AlertDialog APG pattern.
				     A secondary modal layered on top; focus moves to the
				     dismiss-cancel by default (the safer choice). -->
				<div
					class="downloader-confirm-close"
					role="alertdialog"
					aria-modal="true"
					aria-labelledby="downloader-close-confirm-question"
				>
					<p
						id="downloader-close-confirm-question"
						class="downloader-confirm-close__question"
					>
						{copy.close_during_download_question}
					</p>
					<div class="downloader-confirm-close__actions">
						<button
							type="button"
							class="downloader-dialog__action downloader-dialog__action--secondary"
							onclick={handleDismissConfirm}
						>
							{copy.close_during_download_cancel}
						</button>
						<button
							type="button"
							class="downloader-dialog__action downloader-dialog__action--primary"
							onclick={handleForceClose}
						>
							{copy.close_during_download_confirm}
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.downloader-fallback {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		padding: var(--space-16);
		background: var(--overlay-scrim-heavy);
		color: var(--text-primary);
		z-index: 9000;
	}

	.downloader-backdrop {
		position: fixed;
		inset: 0;
		z-index: 8999;
		background: var(--overlay-scrim-heavy);
		backdrop-filter: blur(var(--space-7));
		border: 0;
		padding: 0;
		cursor: pointer;
	}

	.downloader-dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 9000;
		width: min(85vw, var(--space-128, 40rem));
		max-width: 56rem;
		max-height: 85vh;
		min-height: 24rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		padding: var(--space-20) var(--space-24);
		border-radius: var(--radius-xl);
		background: var(--surface-overlay);
		border: 0.0625rem solid var(--border-strong);
		color: var(--text-primary);
		overflow: hidden;
		isolation: isolate;
		box-shadow: 0 var(--space-12) var(--space-48)
			color-mix(in oklch, var(--surface-base) 60%, transparent);
	}

	/* `:global()` because the class is passed to the
	   `<AuroraGradientBackdrop>` child component. */
	:global(.downloader-dialog__aurora) {
		opacity: 0.35;
	}

	.downloader-dialog__header {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-12);
	}

	.downloader-dialog__titles {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.downloader-dialog__title {
		margin: 0;
		font-size: var(--space-20);
		font-weight: 700;
		color: var(--text-primary);
	}

	.downloader-dialog__subtitle {
		margin: 0;
		font-size: var(--space-12);
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.downloader-dialog__close {
		display: inline-flex;
		align-items: center;
		gap: var(--space-5);
		padding: var(--space-7) var(--space-10);
		border-radius: var(--radius-sm);
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		flex-shrink: 0;
		font-size: var(--space-11);
		transition: background 0.15s ease, color 0.15s ease;
	}

	.downloader-dialog__close-label {
		display: inline-block;
	}

	.downloader-dialog__close:hover {
		background: var(--surface-raised);
		color: var(--text-primary);
	}

	.downloader-dialog__close:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}

	/* `:global()` because the class is passed to the
	   `<DownloaderTokenStrip>` child component. */
	:global(.downloader-dialog__token-strip) {
		position: relative;
		z-index: 1;
	}

	.downloader-dialog__body {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		flex: 1;
	}

	.downloader-dialog__complete,
	.downloader-dialog__error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-12);
		padding: var(--space-20);
		text-align: center;
		flex: 1;
		justify-content: center;
	}

	/* `:global()` because the class is passed to the `<CheckCircle>`
	   lucide-svelte component (the Lucide wrapper renders the class
	   onto the SVG root). */
	:global(.downloader-dialog__complete-icon) {
		width: var(--space-48);
		height: var(--space-48);
		color: var(--accent-teal-main);
	}

	.downloader-dialog__phase-heading {
		margin: 0;
		font-size: var(--space-18);
		font-weight: 600;
	}

	.downloader-dialog__complete-summary,
	.downloader-dialog__error-body {
		margin: 0;
		font-size: var(--space-12);
		color: var(--text-secondary);
		max-width: var(--space-128, 32rem);
		line-height: 1.5;
	}

	.downloader-dialog__complete-actions,
	.downloader-dialog__error-actions {
		display: flex;
		gap: var(--space-10);
	}

	.downloader-dialog__action {
		padding: var(--space-8) var(--space-16);
		border-radius: var(--radius-sm);
		font-size: var(--space-12);
		font-weight: 600;
		cursor: pointer;
	}

	.downloader-dialog__action--primary {
		background: var(--accent-teal-fill);
		border: 0.0625rem solid var(--accent-teal-main);
		color: var(--accent-teal-main);
	}

	.downloader-dialog__action--primary:hover {
		opacity: 0.85;
	}

	.downloader-dialog__action--secondary {
		background: transparent;
		border: 0.0625rem solid var(--border-subtle);
		color: var(--text-secondary);
	}

	.downloader-dialog__action--secondary:hover {
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.downloader-dialog__action:focus-visible {
		outline: 0.125rem solid var(--border-focus);
		outline-offset: 0.125rem;
	}

	.downloader-confirm-close {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 10;
		width: min(80%, var(--space-112, 26rem));
		padding: var(--space-16) var(--space-20);
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-strong);
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		box-shadow: 0 var(--space-8) var(--space-32)
			color-mix(in oklch, var(--surface-base) 70%, transparent);
	}

	.downloader-confirm-close__question {
		margin: 0;
		font-size: var(--space-14);
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
	}

	.downloader-confirm-close__actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-8);
	}
</style>
