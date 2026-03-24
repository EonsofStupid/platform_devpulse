<!--
	@component Inline Message
	@kind inline-message
	@layer component
	@category feedback
	@description Compact contextual message displayed adjacent to a form field or content area
	@container false
	@compound true
	@blockCategory feedback
	@defaultStyle inline-message-default
	@styleIds inline-message-default, inline-message-info, inline-message-success, inline-message-warning, inline-message-error
	@requiredAxes color, typography
	@slots root:all, icon:none, content:none
-->
<script lang="ts">
import { useInlineMessage } from "$lib/design/primitives/inline-message/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { InlineMessageProps, InlineMessageTone } from "./types.js";

const TONE_PRESETS: Record<InlineMessageTone, string> = {
	info: "inline-message-info",
	success: "inline-message-success",
	warning: "inline-message-warning",
	error: "inline-message-error",
	help: "inline-message-default",
};

let {
	tone = "info",
	children,
	class: className,
	...rest
}: InlineMessageProps = $props();

const msg = $derived(useInlineMessage({ tone }));
const styleId = $derived(TONE_PRESETS[tone] ?? "inline-message-default");
</script>

<StyleMacro kind="inline-message" style={styleId}>
	<div
		{...msg.root}
		data-kind="inline-message"
		data-slot="root"
		data-tone={tone}
		class={cn(className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
