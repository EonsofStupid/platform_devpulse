<!--
	@component FileUpload
	@kind file-upload
	@layer components

	ColdLight FileUpload — 8-axis visual system.
	StyleMacro provides visual styling.

	Provides a drop zone root with a hidden file input and trigger button.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { FileUploadComponentProps } from "./types.js";

let {
	size = "md",
	accept,
	multiple = false,
	disabled = false,
	onFilesChange,
	children,
	class: className,
	...rest
}: FileUploadComponentProps = $props();

// Resolve ColdLight visual props
const classes = $derived(cn( className));

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
