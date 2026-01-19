<script lang="ts">
    import { vpb } from "../state/vpb.svelte";
    import Topbar from "./topbar.svelte";
    import Tabs from "./tabs.svelte";
    import Toolbar from "./toolbar.svelte";

    // Placeholder content
    import Inspector from "../components/inspector/Inspector.svelte";
    import Builder from "../components/builder/Builder.svelte";
</script>

{#if vpb.isOpen}
    <div
        class="fixed bottom-5 right-5 z-[9999] flex flex-col w-[380px] h-[500px] bg-surface-base border border-white/10 rounded-xl backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-200"
    >
        <!-- Header Zone (Draggable) -->
        <div class="flex flex-col bg-surface-sunken border-b border-white/5">
            <Topbar />
            <Tabs />
        </div>

        <!-- Content Zone -->
        <div class="flex-1 overflow-auto bg-surface-base relative">
            {#if vpb.activeTab === "inspector"}
                <div class="p-4 text-muted">Inspector Placeholder</div>
            {:else}
                <div class="p-4 text-muted">Builder Placeholder</div>
            {/if}
        </div>

        <!-- Footer Zone -->
        <Toolbar />
    </div>
{/if}
