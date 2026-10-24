<!--
  @component ModePill — vertical rail pill
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";
import { cssVarString, renderForge } from "@devpulse/coldlight/renderforge";
import { cn } from "@devpulse/coldlight/utils";
import type { ChatMode } from "../util/chat.types.js";

interface Props {
	mode: ChatMode;
	label: string;
	active: boolean;
	onClick: () => void;
}

let { mode: _mode, label, active, onClick }: Props = $props();

const preset = $derived(active ? "chat-mode-pill-active" : "chat-mode-pill-idle");
const m = $derived(renderForge({ kind: "button", preset, state: "default" }));
</script>

<button
	type="button"
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn("writing-mode-vertical px-2 py-3 rounded-full min-h-[4.5rem] flex items-center justify-center")}
	onclick={onClick}
	aria-pressed={active}
>
	<Text size="xs" weight="semibold" class="[writing-mode:vertical-rl] rotate-180">{label}</Text>
</button>
