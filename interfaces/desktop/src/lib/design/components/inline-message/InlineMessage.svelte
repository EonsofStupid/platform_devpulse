<!--
	@component InlineMessage
	@kind inline-message
	@layer components

	Inline contextual feedback. Hook (ARIA) + StyleMacro (visual).
	Tone-driven: info, success, warning, error, help.
	Unlike Alert, uses role="status" with polite live region.
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
