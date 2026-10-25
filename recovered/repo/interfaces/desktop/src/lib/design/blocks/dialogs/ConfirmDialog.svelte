<!--
	@component ConfirmDialog
	@description Accessible confirmation dialog block.
	Combines Dialog primitives with glass.void recipe.
	ARIA relationships (aria-labelledby/describedby) are wired via ID refs.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Button } from "$lib/design/primitives/button";
import * as Dialog from "$lib/design/primitives/dialog";
import { getRecipe } from "$lib/design/recipes";

interface Props {
	/** Bindable open state */
	open?: boolean;
	/** Dialog title text */
	title: string;
	/** Dialog description/message */
	description: string;
	/** Confirm button label */
	confirmLabel?: string;
	/** Cancel button label */
	cancelLabel?: string;
	/** Called when confirm is clicked */
	onconfirm?: () => void;
	/** Called when cancel is clicked or dialog dismissed */
	oncancel?: () => void;
	/** Destructive styling for confirm button */
	destructive?: boolean;
	/** Optional trigger button content */
	trigger?: Snippet;
}

let {
	open = $bindable(false),
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	onconfirm,
	oncancel,
	destructive = false,
	trigger,
}: Props = $props();

// Unique IDs for ARIA relationships
const titleId = `confirm-dialog-title-${Math.random().toString(36).slice(2, 8)}`;
const descId = `confirm-dialog-desc-${Math.random().toString(36).slice(2, 8)}`;

// Get recipe classes - use recipe defaults
const recipe = getRecipe("dialog.glass.void");
const classes = $derived(
	recipe?.classes({
		accent: recipe.defaults.accent ?? "teal",
		surface: recipe.defaults.surface ?? "glass",
		variant: recipe.defaults.variant,
		size: recipe.defaults.size ?? "md",
		radius: recipe.defaults.radius ?? "lg",
		depth: recipe.defaults.depth ?? 3,
		glow: recipe.defaults.glow ?? "off",
		bevel: recipe.defaults.bevel ?? "off",
	}) ?? {},
);

function handleConfirm() {
	onconfirm?.();
	open = false;
}

function handleCancel() {
	oncancel?.();
	open = false;
}
</script>

<Dialog.Dialog bind:open>
	{#if trigger}
		<Dialog.DialogTrigger class={classes.trigger}>
			{@render trigger()}
		</Dialog.DialogTrigger>
	{/if}

	<Dialog.DialogPortal class={classes.portal}>
		<Dialog.DialogOverlay class={classes.overlay} />
		<Dialog.DialogContent
			class={classes.content}
			aria-labelledby={titleId}
			aria-describedby={descId}
		>
			<header class={classes.header}>
				<Dialog.DialogTitle id={titleId} class={classes.title}>
					{title}
				</Dialog.DialogTitle>
				<Dialog.DialogDescription id={descId} class={classes.description}>
					{description}
				</Dialog.DialogDescription>
			</header>

			<footer class={classes.footer}>
				<Button
					class="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
					onclick={handleCancel}
				>
					{cancelLabel}
				</Button>
				<Button
					class="px-4 py-2 text-sm rounded-md transition-colors {destructive
						? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
						: 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'}"
					onclick={handleConfirm}
				>
					{confirmLabel}
				</Button>
			</footer>

			<Dialog.DialogClose class={classes.close} onclick={handleCancel}>
				<span class="sr-only">Close</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</Dialog.DialogClose>
		</Dialog.DialogContent>
	</Dialog.DialogPortal>
</Dialog.Dialog>
