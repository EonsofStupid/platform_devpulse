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
import { ColdLightDialog } from "$lib/design/api/dsadapters/coldlight/_internal/dialog/dialog.svelte.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { setDialogContext } from "./context.js";
import type { DialogProps } from "./types.js";

let {
	open = false,
	onOpenChange,
	closeOnEscape = true,
	closeOnOutsideClick = true,
	preventScroll = true,
	children,
	class: className,
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
}: DialogProps & { class?: string } = $props();

const dialog = new ColdLightDialog({
	open: () => open,
	onOpenChange: (v) => onOpenChange?.(v),
	closeOnEscape: () => closeOnEscape,
	closeOnOutsideClick: () => closeOnOutsideClick,
	preventScroll: () => preventScroll,
});

setDialogContext(dialog);

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
</script>

<div
	class={cn(visual.segments, visual.radius, className)}
	data-kind="dialog"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</div>
