<!--
  @component TypingIndicator — ONLY infinite cl-breathe in chat domain
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";

interface Props {
	class?: string;
}

let { class: className }: Props = $props();
</script>

<div class={cn("flex items-center gap-1 px-2 py-1", className)} aria-live="polite" aria-label="Assistant is typing">
	<span class="size-1.5 rounded-full bg-[var(--accent-teal-main)] animate-[cl-breathe_1.5s_ease-in-out_infinite]"></span>
	<span class="size-1.5 rounded-full bg-[var(--accent-teal-main)] animate-[cl-breathe_1.5s_ease-in-out_infinite] [animation-delay:120ms]"></span>
	<span class="size-1.5 rounded-full bg-[var(--accent-teal-main)] animate-[cl-breathe_1.5s_ease-in-out_infinite] [animation-delay:240ms]"></span>
</div>
