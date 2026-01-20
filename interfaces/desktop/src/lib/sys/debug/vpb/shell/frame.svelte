<!--
  @file src/lib/sys/debug/vpb/shell/frame.svelte
  @description VPB main frame container

  Uses dp-surface + data-* attributes for styling.
  Renders Builder and Inspector components based on active tab.

  @since 1.0.0
-->
<script lang="ts">
    import { vpb } from "../state/vpb.svelte";
    import Topbar from "./topbar.svelte";
    import Tabs from "./tabs.svelte";
    import Toolbar from "./toolbar.svelte";
    import Inspector from "../components/inspector/Inspector.svelte";
    import Builder from "../components/builder/Builder.svelte";
</script>

{#if vpb.isOpen}
    <div
        class="dp-surface fixed bottom-5 right-5 z-[9999] flex flex-col w-[380px] h-[500px] rounded-xl overflow-hidden transition-all duration-200"
        data-surface="glass"
        data-variant="deep"
        data-role="panel"
    >
        <!-- Header Zone (Draggable) -->
        <div class="dp-surface flex flex-col border-b border-white/5" data-surface="matte" data-variant="sunken">
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
