<script lang="ts">
import { vpb } from "../state/vpb.svelte";
</script>

<div class="flex items-center px-1 pb-1 gap-1">
    <button
        onclick={() => vpb.setTab("inspector")}
        data-state={vpb.activeTab === "inspector" ? "active" : "inactive"}
        class="flex-1 h-7 text-[11px] font-medium rounded text-muted hover:text-primary hover:bg-white/5 data-[state=active]:bg-surface-raised data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
    >
        Inspector
    </button>
    <button
        onclick={() => vpb.setTab("builder")}
        data-state={vpb.activeTab === "builder" ? "active" : "inactive"}
        class="flex-1 h-7 text-[11px] font-medium rounded text-muted hover:text-primary hover:bg-white/5 data-[state=active]:bg-surface-raised data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
    >
        Builder
    </button>
</div>
