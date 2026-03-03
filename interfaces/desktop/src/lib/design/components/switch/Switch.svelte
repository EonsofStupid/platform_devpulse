<!--
	@component Switch
	@kind switch
	@layer components

	ARIA + state only. Builder-driven. ZERO visual.
	Thumb slot rendered internally — thumbClass injected by ui/ layer.
-->
<script lang="ts">
	import type { SwitchComponentProps } from "./types.js";
	import { createSwitch } from "$lib/design/api/adapters/coldlight/_internal/switch/index.js";
	import SwitchRoot from "$lib/design/primitives/switch/Switch.svelte";

	let {
		checked = false,
		disabled = false,
		onCheckedChange,
		thumbClass,
		children,
		class: className,
		...rest
	}: SwitchComponentProps = $props();

	const builder = createSwitch({
		checked: () => checked,
		disabled: () => disabled,
		onCheckedChange: (v: any) => onCheckedChange?.(v),
	});
</script>

<SwitchRoot
	{...builder.root}
	{...rest}
	class={className}
>
	<span {...builder.thumb} class={thumbClass} data-slot="thumb"></span>
	{@render children?.()}
</SwitchRoot>
