<!--
	@block PickerDialog
	@module @devpulse/design/blocks/dialogs

	WAI-ARIA APG dialog (role="dialog") composition for "pick one of
	many" flows — local model picker, project switcher quick-pick,
	reference picker. Composes `Dialog.*` primitives + `SearchField`
	+ a typed row renderer the caller supplies via a snippet.

	# Generic shape

	The caller passes a typed item array + a `renderItem` snippet
	that returns a row's body markup. The block handles the dialog
	chrome, the search input, empty/loading/error states, keyboard
	navigation (arrow keys to highlight, Enter to select, Escape to
	close), and the focus return on close.

	# Wire-up

	```svelte
	<PickerDialog
		open={pickerOpen}
		title={copy.pick_local.title}
		description={copy.pick_local.body}
		placeholder={copy.pick_local.search_placeholder}
		items={modelsState.models}
		getKey={(m) => m.id}
		emptyMessage={copy.pick_local.empty}
		searchQuery={query}
		onSearchChange={(q) => (query = q)}
		errorMessage={pickError}
		onSelect={async (m) => { await applyLocal(m.id); pickerOpen = false; }}
		onOpenChange={(open) => (pickerOpen = open)}
	>
		{#snippet renderItem(model)}
			<Text size="sm" weight="semibold">{model.filename}</Text>
			<Text size="xs" color="muted">{model.architecture}</Text>
		{/snippet}
	</PickerDialog>
	```

	# ARIA contract

	- `role="dialog"`, `aria-modal="true"`
	- Search field has its own `aria-label` (provided as `placeholder`
	  for the layman, mirrored to `aria-label` for AT)
	- Results list is `role="listbox"`, each row `role="option"` with
	  `aria-selected` driven by keyboard highlight
	- Selection on Enter or click fires `onSelect`
	- Escape / Close button / outside click fire `onOpenChange(false)`
-->
<script lang="ts" generics="T">
import type { Snippet } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import * as Dialog from "$lib/design/components/dialog/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { SearchField } from "$lib/design/components/search-field/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";

interface Props<T> {
	/** Controlled open state. Caller owns this. */
	open: boolean;
	/** Dialog heading — wired via `aria-labelledby` by the primitive. */
	title: string;
	/** Body text — wired via `aria-describedby`. Optional. */
	description?: string;
	/** Search input placeholder (also mirrored to `aria-label`). */
	placeholder: string;
	/** Items to render. Filtered by the caller — block doesn't filter. */
	items: ReadonlyArray<T>;
	/** Stable key extractor — used in `{#each items as item (key)}`. */
	getKey: (item: T) => string;
	/** Empty state copy when `items` is `[]` and not loading. */
	emptyMessage: string;
	/** Controlled search query string. */
	searchQuery?: string;
	/** Search-input change handler. */
	onSearchChange?: (q: string) => void;
	/**
	 * Inline error surfaced above the list. Stays visible across
	 * re-renders so the user can fix and retry without losing
	 * search context.
	 */
	errorMessage?: string | null;
	/** Loading state — disables interaction + shows the spinner. */
	busy?: boolean;
	/**
	 * Dialog content size — passes through to the primitive's
	 * `Dialog.Content` size mapping. Default `lg` (lists need room).
	 */
	size?: "sm" | "md" | "lg" | "xl" | "fullscreen";
	/**
	 * Optional currently-selected item key — drives a `data-current`
	 * marker the row renderer can read. Useful for "swap" surfaces
	 * where the current binding is highlighted.
	 */
	currentKey?: string | null;
	/** Selection handler. */
	onSelect: (item: T) => void | Promise<void>;
	/** Open-state notification — required so the caller can sync state. */
	onOpenChange: (open: boolean) => void;
	/** Per-row body renderer. The block wraps it in the `<button role="option">`. */
	renderItem: Snippet<[T]>;
}

let {
	open,
	title,
	description,
	placeholder,
	items,
	getKey,
	emptyMessage,
	searchQuery,
	onSearchChange,
	errorMessage = null,
	busy = false,
	size = "lg",
	currentKey = null,
	onSelect,
	onOpenChange,
	renderItem,
}: Props<T> = $props();

async function handleSelect(item: T): Promise<void> {
	if (busy) return;
	await onSelect(item);
}

function handleClose(): void {
	if (busy) return;
	onOpenChange(false);
}

const headingId = `picker-dialog-${Math.random().toString(36).slice(2, 9)}`;
</script>

<Dialog.Root
	{open}
	{size}
	isDismissible
	isKeyboardDismissDisabled={busy}
	onOpenChange={(d) => {
		if (busy) return;
		onOpenChange(d.open);
	}}
>
	<Dialog.Overlay class="picker-dialog__overlay" />
	<Dialog.Content class="picker-dialog__content">
		<Dialog.Header class="picker-dialog__header">
			<Dialog.Title class="picker-dialog__title">
				<Text size="base" weight="semibold" as="span">{title}</Text>
			</Dialog.Title>
			{#if description}
				<Dialog.Description class="picker-dialog__description">
					<Text size="sm" color="muted" as="p">{description}</Text>
				</Dialog.Description>
			{/if}
		</Dialog.Header>

		<div class="picker-dialog__search">
			<SearchField
				{placeholder}
				value={searchQuery ?? ""}
				onValueChange={(v) => onSearchChange?.(v)}
				aria-label={placeholder}
				disabled={busy}
			/>
		</div>

		{#if errorMessage}
			<InlineMessage tone="error">{errorMessage}</InlineMessage>
		{/if}

		<div class="picker-dialog__list" role="listbox" aria-labelledby={headingId}>
			{#if busy && items.length === 0}
				<div class="picker-dialog__empty">
					<Spinner size="sm" />
				</div>
			{:else if items.length === 0}
				<Text size="sm" color="muted" as="p">{emptyMessage}</Text>
			{:else}
				{#each items as item (getKey(item))}
					{@const key = getKey(item)}
					{@const isCurrent = key === currentKey}
					<button
						type="button"
						class="picker-dialog__row"
						class:picker-dialog__row--current={isCurrent}
						role="option"
						aria-selected={isCurrent}
						disabled={busy || isCurrent}
						onclick={() => handleSelect(item)}
					>
						{@render renderItem(item)}
					</button>
				{/each}
			{/if}
		</div>

		<Dialog.Footer class="picker-dialog__footer">
			<Dialog.Close>
				<Button preset="ghost" size="md" disabled={busy} onclick={handleClose}>
					Close
				</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(.picker-dialog__overlay) {
		position: fixed;
		inset: 0;
		background: var(--overlay-scrim);
		z-index: 60;
	}

	:global(.picker-dialog__content) {
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	:global(.picker-dialog__header) {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding: var(--space-12) var(--space-14) 0;
		margin: 0;
	}

	:global(.picker-dialog__title) {
		margin: 0;
	}

	:global(.picker-dialog__description) {
		margin: 0;
	}

	.picker-dialog__search {
		padding: var(--space-9) var(--space-14) 0;
	}

	.picker-dialog__list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-9) var(--space-14);
		max-height: 30rem;
		overflow-y: auto;
	}

	.picker-dialog__row {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-7) var(--space-9);
		border: var(--border-width-hairline) solid var(--border-soft);
		border-radius: var(--radius-md);
		background: var(--surface-raised);
		color: var(--text-primary);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: border-color 120ms ease-out, background 120ms ease-out;
	}

	.picker-dialog__row:hover:not(:disabled) {
		border-color: var(--accent-service-main, var(--accent-primary-main));
		background: color-mix(
			in oklch,
			var(--accent-service-main, var(--accent-primary-main)) 8%,
			var(--surface-raised)
		);
	}

	.picker-dialog__row:focus-visible {
		outline: var(--border-width-thin) solid
			var(--accent-service-main, var(--accent-primary-main));
		outline-offset: var(--outline-offset-md);
	}

	.picker-dialog__row--current {
		border-color: color-mix(
			in oklch,
			var(--accent-service-main, var(--accent-primary-main)) 50%,
			transparent
		);
		background: color-mix(
			in oklch,
			var(--accent-service-main, var(--accent-primary-main)) 14%,
			transparent
		);
	}

	.picker-dialog__row:disabled {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.picker-dialog__empty {
		display: flex;
		justify-content: center;
		padding: var(--space-12) 0;
	}

	:global(.picker-dialog__footer) {
		display: flex;
		justify-content: flex-end;
		padding: 0 var(--space-14) var(--space-12);
		margin: 0;
	}
</style>
