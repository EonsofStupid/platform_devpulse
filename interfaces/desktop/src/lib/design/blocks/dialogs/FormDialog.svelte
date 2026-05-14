<!--
	@block FormDialog
	@module @devpulse/design/blocks/dialogs

	WAI-ARIA APG dialog (role="dialog") composition for typed form
	modals — Create Project, Add Reference, Edit Settings, etc.
	Wraps the ColdLight `Dialog.*` primitives so the focus trap,
	Escape handling, scroll lock, and aria-* plumbing all come from
	the primitive — this block adds the typed props + a canonical
	Submit/Cancel footer the caller doesn't have to rebuild.

	# When to use this vs ConfirmDialog

	- FormDialog → user is filling in fields, the submit is reversible
	  or non-destructive.
	- ConfirmDialog → user is acknowledging a destructive / one-way
	  action, no form fields, binary decision.

	# Wire-up

	```svelte
	<FormDialog
		open={creating}
		title={copy.project_create.title}
		description={copy.project_create.body}
		submitLabel={copy.project_create.submit}
		cancelLabel={copy.cancel}
		busy={submitting}
		errorMessage={lastError}
		onSubmit={handleSubmit}
		onCancel={() => (creating = false)}
		onOpenChange={(open) => (creating = open)}
	>
		<TextField label={copy.name_label} bind:value={name} required />
		<TextField label={copy.path_label} bind:value={path} required />
	</FormDialog>
	```

	The form body is a single default snippet; the caller composes
	ColdLight `TextField` / `Textarea` / `Select` primitives inside.
	No hardcoded English in this block.

	# ARIA contract

	- `role="dialog"`, `aria-modal="true"` (from primitive)
	- Title id wired via `aria-labelledby` (from primitive)
	- Description id wired via `aria-describedby` (from primitive)
	- Initial focus → first interactive control inside the body
	- Tab cycles through body controls → Cancel → Submit → first body
	- Escape → onCancel + onOpenChange(false) (disabled while `busy`)
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import * as Dialog from "$lib/design/components/dialog/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";

interface Props {
	/** Controlled open state. Caller owns this. */
	open: boolean;
	/** Dialog heading — wired via `aria-labelledby` by the primitive. */
	title: string;
	/** Body text — wired via `aria-describedby`. Optional. */
	description?: string;
	/** Submit button label. */
	submitLabel: string;
	/**
	 * Cancel button label. Optional — when omitted, no Cancel button
	 * renders (rare; usually only for "informational only" dialogs
	 * with a single Close action).
	 */
	cancelLabel?: string;
	/** Disables both buttons while a submit is in flight. */
	busy?: boolean;
	/**
	 * Inline error surfaced above the footer — kept visible across
	 * re-renders so the user can fix the error and retry without
	 * losing form state.
	 */
	errorMessage?: string | null;
	/**
	 * Whether outside-click + Escape dismiss the dialog. Default
	 * true. Set false for "must confirm or cancel" flows.
	 */
	isDismissible?: boolean;
	/**
	 * Dialog content size — passes through to the primitive's
	 * `Dialog.Content` size mapping (`sm | md | lg | xl | fullscreen`).
	 * Default `md`.
	 */
	size?: "sm" | "md" | "lg" | "xl" | "fullscreen";
	/** Submit handler — caller closes the dialog explicitly on success. */
	onSubmit: () => void | Promise<void>;
	/** Cancel handler. Optional — defaults to closing the dialog. */
	onCancel?: () => void;
	/** Open-state notification — required so the caller can sync state. */
	onOpenChange: (open: boolean) => void;
	/** Form body — `TextField`, `Textarea`, etc., composed by the caller. */
	children: Snippet;
}

let {
	open,
	title,
	description,
	submitLabel,
	cancelLabel,
	busy = false,
	errorMessage = null,
	isDismissible = true,
	size = "md",
	onSubmit,
	onCancel,
	onOpenChange,
	children,
}: Props = $props();

function handleCancel(): void {
	if (busy) return;
	onCancel?.();
	onOpenChange(false);
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
	event.preventDefault();
	if (busy) return;
	await onSubmit();
}
</script>

<Dialog.Root
	{open}
	{size}
	{isDismissible}
	isKeyboardDismissDisabled={!isDismissible || busy}
	onOpenChange={(d) => {
		if (busy) return;
		onOpenChange(d.open);
	}}
>
	<Dialog.Overlay class="form-dialog__overlay" />
	<Dialog.Content class="form-dialog__content">
		<form class="form-dialog__form" onsubmit={handleSubmit} novalidate>
			<Dialog.Header class="form-dialog__header">
				<Dialog.Title class="form-dialog__title">
					<Text size="md" weight="semibold" as="span">{title}</Text>
				</Dialog.Title>
				{#if description}
					<Dialog.Description class="form-dialog__description">
						<Text size="sm" color="muted" as="p">{description}</Text>
					</Dialog.Description>
				{/if}
			</Dialog.Header>

			<div class="form-dialog__body">
				{@render children()}
			</div>

			{#if errorMessage}
				<InlineMessage tone="error">{errorMessage}</InlineMessage>
			{/if}

			<Dialog.Footer class="form-dialog__footer">
				{#if cancelLabel}
					<Button
						preset="ghost"
						size="md"
						type="button"
						disabled={busy}
						onclick={handleCancel}
					>
						{cancelLabel}
					</Button>
				{/if}
				<Button preset="primary" size="md" type="submit" disabled={busy}>
					{#if busy}
						<Spinner size="xs" />
					{/if}
					{submitLabel}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(.form-dialog__overlay) {
		position: fixed;
		inset: 0;
		background: var(--overlay-scrim);
		z-index: 60;
	}

	:global(.form-dialog__content) {
		padding: 0;
	}

	.form-dialog__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
		padding: var(--space-12) var(--space-14);
	}

	:global(.form-dialog__header) {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		margin: 0;
	}

	:global(.form-dialog__title) {
		margin: 0;
	}

	:global(.form-dialog__description) {
		margin: 0;
	}

	.form-dialog__body {
		display: flex;
		flex-direction: column;
		gap: var(--space-9);
	}

	:global(.form-dialog__footer) {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-7);
		margin: 0;
	}
</style>
