<script lang="ts">
    import { global } from "$lib/sys/runes/global.svelte";
    import Sidebar from "./Sidebar.svelte";
    import TopBar from "$lib/domains/app/devpulse/components/TopBar.svelte";
    import StatusBar from "$lib/domains/app/devpulse/components/StatusBar.svelte";

    // Props (Snippet insertion point for children)
    let { children } = $props();
</script>

<!-- 
    GLASS SHELL LAYOUT 
    Grid Areas:
    [ Header  Header ]
    [ Sidebar Content ]
    [ Status  Status ]
-->
<div class="app-shell" data-theme={global.theme}>
    <aside class="shell-sidebar" class:expanded={global.sidebar_expanded}>
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

    <footer class="shell-status">
        <StatusBar />
    </footer>
</div>

<style>
    /* Senior CSS: No Tailwind unless requested. Pure CSS Grid. */
    .app-shell {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto 1fr auto; /* Top, Content, Status */
        grid-template-areas:
            "header header"
            "sidebar content"
            "status status";
        height: 100vh;
        width: 100vw;
        background: radial-gradient(
                circle at 50% 0%,
                rgba(0, 255, 204, 0.08) 0%,
                transparent 50%
            ),
            radial-gradient(
                circle at 100% 100%,
                rgba(153, 0, 255, 0.05) 0%,
                transparent 40%
            ),
            linear-gradient(180deg, #0a0a0f 0%, #0f0f13 100%);
        background-size: cover;
        background-position: center;
        transition: background-image 0.5s ease; /* Smooth transition */
        color: #e0e0e0;
        overflow: hidden; /* No Global Scrollbars */
    }

    .shell-sidebar {
        grid-area: sidebar;
        width: 64px;
        transition:
            width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            background-color 0.5s ease;
        border-right: 1px solid rgba(255, 255, 255, 0.05); /* Separator from Content */
        /* Background handled by inline style for dynamic tint */
        backdrop-filter: blur(12px);
    }

    .shell-sidebar.expanded {
        width: 240px;
    }

    .shell-status {
        grid-area: status;
        height: 32px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(8px);
        z-index: 10; /* Ensure on top */
        display: flex;
        align-items: center;
        padding: 0 1rem;
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
