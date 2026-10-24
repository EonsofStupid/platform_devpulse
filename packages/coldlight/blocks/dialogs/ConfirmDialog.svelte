<!--
	@block ConfirmDialog
	@module @devpulse/design/blocks/dialogs

	WAI-ARIA APG alertdialog composition for destructive / consequential
	confirms. Wraps the ColdLight `AlertDialog.*` primitives — that's
	where focus trap, Escape handling, `role="alertdialog"`, and
	`aria-labelledby` / `aria-describedby` come from. This block adds
	the typed props + canonical layout so callers don't reauthor the
	Cancel + Action footer every time.

	Use ConfirmDialog when you need a binary decision the user MUST
	make before continuing — destructive deletes, irreversible swaps,
	one-way migrations. For non-destructive single-action confirms
	(e.g. "Continue"), prefer the friendlier FormDialog block since
	it composes Dialog (role="dialog"), not AlertDialog.

	# Wire-up

	```svelte
	<ConfirmDialog
		open={confirmOpen}
		title={copy.delete.title}
		description={copy.delete.body}
		confirmLabel={copy.delete.cta}
		cancelLabel={copy.cancel}
		destructive
		busy={deleting}
		onConfirm={async () => { await doDelete(); confirmOpen = false; }}
		onCancel={() => (confirmOpen = false)}
		onOpenChange={(open) => (confirmOpen = open)}
	/>
	```

	Strings flow in via props — see ONBOARDING-CASCADE.md Layer 3.
	No hardcoded English here. The caller fetches from `wizardCopy.*`
	or any other typed copy struct returned by `getWizardCopy()`.
-->
<script lang="ts">
import * as AlertDialog from "#coldlight/components/alert-dialog/index.js";
import { Button } from "#coldlight/components/button/index.js";
import { InlineMessage } from "#coldlight/components/inline-message/index.js";
import { Spinner } from "#coldlight/components/spinner/index.js";
import { Text } from "#coldlight/components/text/index.js";

interface Props {
	/** Controlled open state. Caller owns this. */
	open: boolean;
	/** Dialog heading — wired via `aria-labelledby` by the primitive. */
	title: string;
	/** Body text — wired via `aria-describedby`. Optional. */
	description?: string;
	/** Action button label (e.g. "Delete", "Swap encoder"). */
	confirmLabel: string;
	/** Cancel button label (e.g. "Cancel", "Keep current"). */
	cancelLabel: string;
	/**
	 * When true, the action button uses the `danger` preset (red CTA),
	 * the dialog cannot be dismissed by clicking outside or pressing
	 * Escape — the user must explicitly Cancel or Confirm. Use for
	 * irreversible actions only.
	 */
	destructive?: boolean;
	/** Disables both buttons while a confirm is in flight. */
	busy?: boolean;
	/**
	 * Inline error to surface above the footer (e.g. a confirm RPC
	 * failed but the dialog stays open so the user can retry).
	 */
	errorMessage?: string | null;
	/** Confirm handler — caller closes the dialog explicitly. */
	onConfirm: () => void | Promise<void>;
	/** Cancel handler. Optional — defaults to closing the dialog. */
	onCancel?: () => void;
	/** Open-state notification — required so the caller can sync state. */
	onOpenChange: (open: boolean) => void;
}

let {
	open,
	title,
	description,
	confirmLabel,
	cancelLabel,
	destructive = false,
	busy = false,
	errorMessage = null,
	onConfirm,
	onCancel,
	onOpenChange,
}: Props = $props();

function handleCancel(): void {
	if (busy) return;
	onCancel?.();
	onOpenChange(false);
}

async function handleConfirm(): Promise<void> {
	if (busy) return;
	await onConfirm();
}
</script>

<AlertDialog.Root
	{open}
	variant={destructive ? "destructive" : "confirmation"}
	onOpenChange={(d) => {
		if (busy) return;
		onOpenChange(d.open);
	}}
>
	<AlertDialog.Overlay class="confirm-dialog__overlay" />
	<AlertDialog.Content class="confirm-dialog__content">
		<AlertDialog.Title class="confirm-dialog__title">
			<Text size="base" weight="semibold" as="span">{title}</Text>
		</AlertDialog.Title>

		{#if description}
			<AlertDialog.Description class="confirm-dialog__description">
				<Text size="sm" color="muted" as="p">{description}</Text>
			</AlertDialog.Description>
		{/if}

		{#if errorMessage}
			<InlineMessage tone="error">{errorMessage}</InlineMessage>
		{/if}

		<div class="confirm-dialog__footer">
			<AlertDialog.Cancel>
				<Button variant="ghost" size="md" disabled={busy} onclick={handleCancel}>
					{cancelLabel}
				</Button>
			</AlertDialog.Cancel>
			<AlertDialog.Action>
				<Button
					variant={destructive ? "danger" : "primary"}
					size="md"
					disabled={busy}
					onclick={handleConfirm}
				>
					{#if busy}
						<Spinner size="xs" />
					{/if}
					{confirmLabel}
				</Button>
			</AlertDialog.Action>
		</div>
	</AlertDialog.Content>
</AlertDialog.Root>

<style>
	:global(.confirm-dialog__overlay) {
		position: fixed;
		inset: 0;
		background: var(--overlay-scrim-heavy);
		z-index: 60;
	}

	:global(.confirm-dialog__content) {
		display: flex;
		flex-direction: column;
		gap: var(--space-9);
		padding: var(--space-12) var(--space-14);
		max-width: min(28rem, 100%);
	}

	:global(.confirm-dialog__title) {
		margin: 0;
	}

	:global(.confirm-dialog__description) {
		margin: 0;
	}

	.confirm-dialog__footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-7);
		margin-top: var(--space-4);
	}
</style>
