<script lang="ts">
import { vpb } from "../state/vpb.svelte";
</script>

<div
    class="h-7 glass-void border-t border-white/5 flex items-center px-3 gap-2"
>
    <div class="w-2 h-2 rounded-full bg-[var(--color-teal-500)] animate-pulse"></div>
    <span class="text-[10px] font-mono text-[var(--text-muted)]">Ready</span>

    <div class="flex-1"></div>

    <span class="text-[10px] font-mono text-white/20">v1.0.0</span>
</div>
