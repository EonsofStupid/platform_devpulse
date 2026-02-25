<!--
	@component Dialog
	@kind dialog
	@layer components

	ColdLight Dialog root — creates ColdLightDialog adapter and provides via context.
	Compound component: sub-components consume context to render slots.

	ColdLight OWNS all ARIA. No MeltUI dependency.
	Reference: WAI-ARIA APG Dialog (Modal) Pattern
-->
<script lang="ts">
	import type { DialogProps } from "./types.js";
	import { ColdLightDialog } from "$lib/design/api/adapters/coldlight/_internal/dialog/dialog.svelte.js";
	import { setDialogContext } from "./context.js";

	let {
		open = false,
		onOpenChange,
		closeOnEscape = true,
		closeOnOutsideClick = true,
		preventScroll = true,
		children,
	}: DialogProps = $props();

	const dialog = new ColdLightDialog({
		open: () => open,
		onOpenChange: (v) => onOpenChange?.(v),
		closeOnEscape: () => closeOnEscape,
		closeOnOutsideClick: () => closeOnOutsideClick,
		preventScroll: () => preventScroll,
	});

	setDialogContext(dialog);
</script>

{@render children?.()}
