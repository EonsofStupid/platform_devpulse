<!--
	@component Dynamic Background
	@kind dynamic-background
	@layer component
	@category layout
	@description Full-viewport background layer with per-domain variants and optional image
	@container true
	@containerSlots content
	@compound false
	@blockCategory layout
	@defaultStyle dynamic-background-boot
	@styleIds dynamic-background-boot, dynamic-background-devpulse, dynamic-background-overmind, dynamic-background-wiredfront, dynamic-background-devforge, dynamic-background-maestro
	@requiredAxes backgroundColor, color, opacity
	@slots root:all
	@defaults {
		"background-color": "oklch(0.05 0.015 224)",
		"color": "oklch(0.9319 0.015 224)",
		"opacity": "1"
}
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { DynamicBackgroundProps } from "./types.js";

let {
	variant = "boot",
	src,
	animated = true,
	style,
	children,
	class: className,
	...rest
}: DynamicBackgroundProps = $props();

const styleId = $derived(`dynamic-background-${style ?? variant}`);
</script>

<StyleMacro kind="dynamic-background" style={styleId}>
	<div
		aria-hidden="true"
		data-kind="dynamic-background"
		data-slot="root"
		data-variant={variant}
		data-animated={String(animated)}
		class={cn(
			"fixed inset-0 -z-10 overflow-hidden",
			"bg-cover bg-center bg-no-repeat",
			animated && "animate-[breathe_8s_ease-in-out_infinite]",
			className,
		)}
		style={src ? `background-image: url('${src}');` : undefined}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>

<style>
	@keyframes breathe {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.92; }
	}
</style>
