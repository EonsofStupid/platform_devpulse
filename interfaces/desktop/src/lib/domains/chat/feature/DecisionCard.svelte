<!--
  @feature DecisionCard — embedded task / decision shell
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";

type CardState = "draft" | "locked" | "resolved";

interface Props {
	title: string;
	body: string;
	state?: CardState;
	class?: string;
}

let { title, body, state = "draft", class: className }: Props = $props();

const preset = $derived("chat-decision-card");
const m = $derived(renderForge({ kind: "chat-bubble", preset, state: "default" }));
const lockedPulse = $derived(
	state === "locked" ? "animate-[cl-glow-pulse_3s_ease-in-out_infinite]" : "",
);
</script>

<div
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn("flex flex-col gap-2 rounded-lg p-3", lockedPulse, className)}
>
	<Text size="xs" weight="semibold">{title}</Text>
	<Text size="sm" class="text-[var(--text-muted)] whitespace-pre-wrap">{body}</Text>
	<div class="flex flex-wrap gap-2">
		<Button preset="ghost" size="sm">Edit</Button>
		<Button preset="primary" size="sm">Approve</Button>
		<Button preset="danger" size="sm">Decline</Button>
	</div>
</div>
