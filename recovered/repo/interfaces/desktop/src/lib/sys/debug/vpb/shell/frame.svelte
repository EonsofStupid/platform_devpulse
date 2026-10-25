<!--
  @file src/lib/sys/debug/vpb/shell/frame.svelte
  @layer vpb

  VPB main frame container. ColdLight molecules provide all visual styling.
  Renders Builder and Inspector components based on active tab.

  @since 1.0.0
-->
<script lang="ts">
import Builder from "../components/builder/Builder.svelte";
import Inspector from "../components/inspector/Inspector.svelte";
import { vpb } from "../state/vpb.svelte";
import Tabs from "./tabs.svelte";
import Toolbar from "./toolbar.svelte";
import Topbar from "./topbar.svelte";
</script>

{#if vpb.isOpen}
    <div
        class="glass-deep bevel-subtle depth-elevated fixed bottom-5 right-5 z-[var(--z-vpb)] flex flex-col w-[380px] h-[500px] rounded-[var(--radius-xl)] overflow-hidden transition-all duration-[var(--duration-normal)]"
        data-kind="vpb"
        data-slot="root"
    >
        <!-- Header Zone (Draggable) -->
        <div class="glass-smoke flex flex-col border-b border-white/5">
            <Topbar />
            <Tabs />
        </div>

        <!-- Content Zone -->
        <div class="flex-1 overflow-hidden relative">
            {#if vpb.activeTab === "inspector"}
                <Inspector />
            {:else}
                <Builder />
            {/if}
        </div>

        <!-- Footer Zone -->
        <Toolbar />
    </div>
{/if}
