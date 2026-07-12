<!--
  @component SessionRow — session rail row
-->
<script lang="ts">
import Text from "$lib/design/components/text/Text.svelte";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatSession } from "$lib/sys/generated/bindings.js";
import { previewText } from "../util/format.js";

interface Props {
	session: ChatSession;
	active: boolean;
	onClick: () => void;
	class?: string;
}

let { session, active, onClick, class: className }: Props = $props();

const preset = $derived(active ? "chat-session-row-active" : "neuro-minimal");
const m = $derived(renderForge({ kind: "chat-sidebar", preset, state: "default" }));
</script>

<button
	type="button"
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn(
		"flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left border-l-4",
		active ? "border-[var(--accent-primary-main)]" : "border-transparent",
		className,
	)}
	onclick={onClick}
>
	<Text size="xs" weight="semibold" class="truncate">{session.title ?? session.id}</Text>
	<Text size="xs" class="text-[var(--text-muted)] truncate">{previewText(session.id, 28)}</Text>
</button>
