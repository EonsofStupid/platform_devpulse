<!--
  @file ClyffyNarration — Clyffy message bubble for model events.
  Uses resolveMacro with semantic intent presets for type-based styling.
-->
<script lang="ts">
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro/index.js";
import type { SemanticIntent } from "$lib/design/visual/preset-id.js";

interface Props {
	message: string;
	type?: "info" | "success" | "warning" | "error";
}

let { message, type = "info" }: Props = $props();

const intentMap: Record<string, SemanticIntent> = {
	info: "info",
	success: "success",
	warning: "warning",
	error: "danger",
};

const m = $derived(
	resolveMacro({
		kind: "clyffy-narration",
		preset: intentMap[type] ?? "info",
	}),
);

const icon = $derived.by(() => {
	switch (type) {
		case "success":
			return "✓";
		case "warning":
			return "⚠";
		case "error":
			return "✗";
		default:
			return "💬";
	}
});
</script>

<div
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class="flex items-start gap-2 rounded-lg border-l-2 px-3 py-2"
>
	<span class="shrink-0 text-sm" style="color: var(--cl-color);">
		{icon}
	</span>
	<Text size="sm" color="secondary" as="p">
		{message}
	</Text>
</div>
