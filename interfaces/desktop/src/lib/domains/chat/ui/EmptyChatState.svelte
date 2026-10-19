<!--
  @component EmptyChatState
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";
import { cn } from "@devpulse/coldlight/utils";
import { Sparkles } from "lucide-svelte";

interface Props {
	class?: string;
}

let { class: className }: Props = $props();
</script>

<div class={cn("flex flex-col items-center justify-center gap-2 py-8 flex-1", className)}>
	<Sparkles size={24} class="text-[var(--accent-teal-main)] drop-shadow-[0_0_0.5rem_var(--accent-teal-glow)]" />
	<Text size="sm" preset="default">No messages yet. Start a conversation.</Text>
</div>
