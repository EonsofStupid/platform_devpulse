<!--
	@component FileUpload
	@kind file-upload
	@layer components

	ColdLight FileUpload — 8-axis visual system.
	useColdLight() resolves visual props.

	Provides a drop zone root with a hidden file input and trigger button.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/primitives/types.js";
import type { FileUploadComponentProps } from "./types.js";

let {
	size = "md",
	accept,
	multiple = false,
	disabled = false,
	onFilesChange,
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
	// Rest spread
	...rest
}: FileUploadComponentProps = $props();

// Resolve ColdLight visual props
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

const classes = $derived(cn(visual.segments, visual.radius, className));

function handleChange(e: Event) {
	const target = e.target as HTMLInputElement;
	onFilesChange?.(target.files);
}
</script>

<div
	{...rest}
	class={classes}
	data-kind="file-upload"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
	aria-disabled={disabled || undefined}
>
	{@render children?.()}
	<input
		type="file"
		{accept}
		{multiple}
		{disabled}
		onchange={handleChange}
		class="sr-only"
		data-slot="hiddenInput"
		tabindex="-1"
	/>
</div>
