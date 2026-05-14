<!--
	@block WizardDialog
	@module @devpulse/design/blocks/dialogs

	WAI-ARIA APG dialog chrome for multi-step flows — setup wizard,
	downloader, any "guided sequence with progress" surface. Wraps
	the ColdLight `Dialog.*` primitives + adds the canonical wizard
	frame: header with title / subtitle / step indicator + body
	(caller's snippet) + footer (caller's nav-button snippet).

	Use this in place of a hand-rolled `OverlayShell` whenever a
	view sits inside a multi-step modal. The block enforces the
	non-dismissible wizard contract — clicking outside does NOT
	close the dialog and Escape only closes when the caller wires
	`isDismissible={true}`.

	# Wire-up

	```svelte
	<WizardDialog
		open={state.phase !== "complete"}
		title={copy.wizard.title}
		subtitle={copy.wizard.subtitle}
		step={state.currentStep}
		totalSteps={state.totalSteps}
		labelledBy="wizard-title"
		onOpenChange={(open) => (open ? null : state.cancel())}
	>
		{@render currentView()}

		{#snippet footer()}
			<Button preset="ghost" onclick={state.back}>Back</Button>
			<div class="ml-auto" />
			<Button preset="primary" onclick={state.next}>Next</Button>
		{/snippet}
	</WizardDialog>
	```

	# ARIA contract

	- `role="dialog"`, `aria-modal="true"` from the primitive
	- Title id wired via `aria-labelledby` (primitive)
	- Subtitle id wired via `aria-describedby` (primitive)
	- Step indicator announces "Step N of M" via `aria-label`
	- Initial focus → first focusable inside the body (primitive)
	- Escape: only fires when `isDismissible` is true (the wizard's
	  Cancel button is the canonical exit)

	# Visual chrome

	The dialog is **always** sized `lg` and uses a non-translucent
	backdrop — wizards are full-attention modals, not glancing-
	overlay surfaces. Caller can flip `size="fullscreen"` for the
	"first run" hero variant where the wizard owns the whole window.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import * as Dialog from "$lib/design/components/dialog/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Text } from "$lib/design/components/text/index.js";

interface Props {
	/** Controlled open state. Caller owns this. */
	open: boolean;
	/** Wizard heading — wired via `aria-labelledby` by the primitive. */
	title: string;
	/** Optional subtitle / explanatory line under the heading. */
	subtitle?: string;
	/**
	 * Current step number (1-indexed). Pair with `totalSteps` to
	 * render the "Step N of M" indicator. Omit both to suppress.
	 */
	step?: number;
	/** Total steps in this wizard. See `step`. */
	totalSteps?: number;
	/**
	 * Whether outside-click + Escape dismiss the dialog. Default
	 * `false` — wizards have explicit Cancel buttons.
	 */
	isDismissible?: boolean;
	/**
	 * Dialog content size. Default `lg`. Pass `fullscreen` for the
	 * first-run hero variant.
	 */
	size?: "sm" | "md" | "lg" | "xl" | "fullscreen";
	/** Open-state notification — required so the caller can sync state. */
	onOpenChange: (open: boolean) => void;
	/** Wizard view body — the per-step content. */
	children: Snippet;
	/**
	 * Optional footer with navigation controls (Back / Next /
	 * Cancel / Skip). When omitted, the wizard renders with no
	 * footer — typically only on the welcome / completion screens
	 * where the navigation lives inside the body.
	 */
	footer?: Snippet;
}

let {
	open,
	title,
	subtitle,
	step,
	totalSteps,
	isDismissible = false,
	size = "lg",
	onOpenChange,
	children,
	footer,
}: Props = $props();

const stepLabel = $derived(
	step !== undefined && totalSteps !== undefined ? `Step ${step} of ${totalSteps}` : null,
);
</script>

<Dialog.Root
	{open}
	{size}
	{isDismissible}
	isKeyboardDismissDisabled={!isDismissible}
	onOpenChange={(d) => onOpenChange(d.open)}
>
	<Dialog.Overlay class="wizard-dialog__overlay" />
	<Dialog.Content class="wizard-dialog__content">
		<Dialog.Header class="wizard-dialog__header">
			<div class="wizard-dialog__title-row">
				<Dialog.Title class="wizard-dialog__title">
					<Heading level={2} size="md">{title}</Heading>
				</Dialog.Title>
				{#if stepLabel}
					<Text size="xs" color="muted" as="span" aria-label={stepLabel}>
						{stepLabel}
					</Text>
				{/if}
			</div>
			{#if subtitle}
				<Dialog.Description class="wizard-dialog__subtitle">
					<Text size="sm" color="muted" as="p">{subtitle}</Text>
				</Dialog.Description>
			{/if}
		</Dialog.Header>

		<div class="wizard-dialog__body">
			{@render children()}
		</div>

		{#if footer}
			<Dialog.Footer class="wizard-dialog__footer">
				{@render footer()}
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(.wizard-dialog__overlay) {
		position: fixed;
		inset: 0;
		background: var(--overlay-scrim-heavy);
		z-index: 60;
	}

	:global(.wizard-dialog__content) {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		padding: var(--space-14) var(--space-16);
		min-height: min(36rem, 80vh);
	}

	:global(.wizard-dialog__header) {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		margin: 0;
	}

	.wizard-dialog__title-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-9);
	}

	:global(.wizard-dialog__title) {
		margin: 0;
	}

	:global(.wizard-dialog__subtitle) {
		margin: 0;
	}

	.wizard-dialog__body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
		min-height: 0;
	}

	:global(.wizard-dialog__footer) {
		display: flex;
		align-items: center;
		gap: var(--space-7);
		margin: 0;
	}
</style>
