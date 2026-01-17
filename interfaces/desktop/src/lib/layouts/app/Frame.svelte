<!--
    FRAME.SVELTE - App Shell (SSOT)
    ================================
    Grid Layout: TopBar (100%) | Sidebar + Content | StatusBar (100%)
    NO horizontal scrollbar. Content scrolls vertically inside.
    Uses design tokens from lib/design/tokens.css
-->
<script lang="ts">
    import type { Snippet } from "svelte";
    import TopBar from "./TopBar.svelte";
    import Sidebar from "./Sidebar.svelte";
    import StatusBar from "./StatusBar.svelte";

    interface Props {
        children: Snippet;
    }

    let { children }: Props = $props();
</script>

<div class="app-frame" data-route="devpulse">
    <header class="frame-topbar">
        <TopBar />
    </header>

    <aside class="frame-sidebar">
        <Sidebar />
    </aside>

    <main class="frame-content">
        <div class="content-scroll">
            {@render children()}
        </div>
    </main>

    <footer class="frame-statusbar">
        <StatusBar />
    </footer>
</div>

<style>
    /* =============================================
       APP FRAME - CSS Grid Layout
       ============================================= */
    .app-frame {
        display: grid;
        grid-template-rows: 48px 1fr 32px;
        grid-template-columns: 64px 1fr;
        grid-template-areas:
            "topbar  topbar"
            "sidebar content"
            "status  status";
        width: 100%;
        height: 100%;
        overflow: hidden; /* CRITICAL: No scroll on frame */
        background: var(--color-void);
        color: var(--text-white);
        font-family: var(--font-sans);
    }

    /* TopBar - 100% width, no padding */
    .frame-topbar {
        grid-area: topbar;
        width: 100%;
        height: 100%;
        background: var(--surface-glass-void);
        backdrop-filter: blur(var(--blur-xl));
        border-bottom: var(--border-subtle);
        box-shadow: var(--bevel-outset-medium), var(--shadow-z3);
        z-index: 100;
    }

    /* Sidebar - Fixed width, between TopBar and StatusBar */
    .frame-sidebar {
        grid-area: sidebar;
        width: 100%;
        height: 100%;
        background: var(--surface-glass-deep);
        backdrop-filter: blur(var(--blur-lg));
        border-right: var(--border-subtle);
        overflow-y: auto;
        overflow-x: hidden;
    }

    /* Content - Scrollable area */
    .frame-content {
        grid-area: content;
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
    }

    .content-scroll {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden; /* NEVER horizontal scroll */
        padding: var(--space-4);
    }

    /* StatusBar - 100% width, no padding */
    .frame-statusbar {
        grid-area: status;
        width: 100%;
        height: 100%;
        background: var(--surface-glass-void);
        backdrop-filter: blur(var(--blur-lg));
        border-top: var(--border-subtle);
        box-shadow: var(--bevel-outset-soft);
        z-index: 100;
    }

    /* Custom Scrollbar */
    .content-scroll::-webkit-scrollbar {
        width: 6px;
    }
    .content-scroll::-webkit-scrollbar-track {
        background: hsla(240, 20%, 4%, 0.3);
    }
    .content-scroll::-webkit-scrollbar-thumb {
        background: hsla(168, 100%, 50%, 0.4);
        border-radius: 3px;
    }
    .content-scroll::-webkit-scrollbar-thumb:hover {
        background: hsla(168, 100%, 50%, 0.7);
    }

    /* Sidebar Custom Scrollbar */
    .frame-sidebar::-webkit-scrollbar {
        width: 4px;
    }
    .frame-sidebar::-webkit-scrollbar-track {
        background: transparent;
    }
    .frame-sidebar::-webkit-scrollbar-thumb {
        background: hsla(0, 0%, 100%, 0.1);
        border-radius: 2px;
    }
</style>
