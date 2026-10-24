<!--
	@component File Upload
	@kind file-upload
	@layer component
	@category interactive
	@description Drag-and-drop or click-to-browse control for selecting and uploading files
	@container false
	@compound true
	@blockCategory form
	@defaultStyle file-upload-default
	@styleIds file-upload-default
	@requiredAxes backgroundColor, border, borderRadius, color, typography
	@slots root:all, dropzone:none, trigger:none, fileList:none, label:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { cssVarString, renderForge } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
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
const classes = $derived(cn(className));

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
