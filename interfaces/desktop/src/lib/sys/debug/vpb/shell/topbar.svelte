<script lang="ts">
import { vpb } from "../state/vpb.svelte";
</script>

<div
    class="h-9 flex items-center justify-between px-3 select-none cursor-move group"
>
    <!-- Drag Handle / Title -->
    <div
        class="flex items-center gap-2 text-xs font-mono text-muted group-hover:text-primary transition-colors"
    >
        <span class="opacity-50">::</span>
        <span class="font-bold tracking-tight"
            >DEV<span class="text-teal-400">PULSE</span></span
        >
    </div>

    <!-- Window Controls -->
    <div class="flex items-center gap-1">
        <button
            onclick={() => vpb.toggle()}
            class="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-muted hover:text-white transition-colors"
        >
            <span class="text-[10px]">✕</span>
        </button>
    </div>
</div>
