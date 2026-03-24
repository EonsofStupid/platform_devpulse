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
