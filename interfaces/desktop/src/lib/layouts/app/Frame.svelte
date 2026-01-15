<script lang="ts">
    import { appState } from "$lib/sys/app_state.svelte";
    import Sidebar from "./Sidebar.svelte";
    import TopBar from "./TopBar.svelte";

    // Props (Snippet insertion point for children)
    let { children } = $props();
</script>

<!-- 
    GLASS SHELL LAYOUT 
    Grid Areas:
    [ Sidebar ] [ TopBar  ]
    [ Sidebar ] [ Content ]
-->
<div 
    class="app-shell" 
    data-theme={appState.theme_mode}
    style:background-image="url('{appState.background_asset}')"
>
    <aside 
        class="shell-sidebar" 
        class:expanded={appState.sidebar_expanded}
        style:background={appState.glass_tint}
    >
        <Sidebar />
    </aside>

    <header class="shell-header">
        <TopBar />
    </header>

    <main class="shell-content">
        <!-- The "Glass" Viewport -->
        <div class="glass-pane">
            {@render children()}
        </div>
    </main>
</div>

<style>
    /* Senior CSS: No Tailwind unless requested. Pure CSS Grid. */
    .app-shell {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto 1fr;
        grid-template-areas: 
            "sidebar header"
            "sidebar content";
        height: 100vh;
        width: 100vw;
        background: #0f0f13; /* Fallback Color */
        background-size: cover;
        background-position: center;
        transition: background-image 0.5s ease; /* Smooth transition */
        color: #e0e0e0;
        overflow: hidden; /* No Global Scrollbars */
    }

    .shell-sidebar {
        grid-area: sidebar;
        width: 64px;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        /* Background handled by inline style for dynamic tint */
        backdrop-filter: blur(12px);
    }

    .shell-sidebar.expanded {
        width: 240px;
    }

    .shell-header {
        grid-area: header;
        height: 48px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        padding: 0 1rem;
    }

    .shell-content {
        grid-area: content;
        padding: 1rem;
        overflow: hidden; /* Local scroll only */
        position: relative;
    }

    .glass-pane {
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        backdrop-filter: blur(4px);
        overflow-y: auto;
    }
</style>
