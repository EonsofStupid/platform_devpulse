<!--
	@component AlertDialog
	@kind alert-dialog
	@layer components

	ColdLight AlertDialog root — manages open state and provides context.
	ColdLight-owned ARIA. No MeltUI dependency.
	Extends dialog pattern with role="alertdialog" and APG safety pattern
	(cancel button receives initial focus).

	Reference: WAI-ARIA APG Alert and Message Dialogs
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { type AlertDialogContext, setAlertDialogContext } from "./context.js";
import type { AlertDialogProps } from "./types.js";

let {
	open = false,
	onOpenChange,
	children,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}: AlertDialogProps = $props();

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));

let triggerEl: HTMLElement | null = $state(null);
let cancelEl: HTMLElement | null = $state(null);
let contentEl: HTMLDialogElement | null = $state(null);

const ids = {
	content: `alert-dialog-content-${crypto.randomUUID().slice(0, 8)}`,
	title: `alert-dialog-title-${crypto.randomUUID().slice(0, 8)}`,
	description: `alert-dialog-description-${crypto.randomUUID().slice(0, 8)}`,
};

function setOpen(value: boolean): void {
	open = value;
	onOpenChange?.(value);
}

const ctx: AlertDialogContext = {
	get open() {
		return open;
	},
	setOpen,
	titleId: ids.title,
	descriptionId: ids.description,
	contentId: ids.content,
	registerTrigger(el: HTMLElement) {
		triggerEl = el;
	},
	registerCancel(el: HTMLElement) {
		cancelEl = el;
	},
	registerContent(el: HTMLDialogElement) {
		contentEl = el;
	},
};

setAlertDialogContext(ctx);

// Focus cancel button when opening (APG safety pattern)
$effect(() => {
	if (open && cancelEl) {
		// Defer focus to next tick so DOM is ready
		requestAnimationFrame(() => {
			cancelEl?.focus();
		});
	}
	if (!open && triggerEl) {
		// Restore focus to trigger on close
		triggerEl?.focus();
	}
});
</script>

{@render children?.()}
