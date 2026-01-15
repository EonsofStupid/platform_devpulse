<script lang="ts">
    import { appState } from "$lib/sys/app_state.svelte";

    // Simple Navigation Data
    const navItems = [
        { id: "home", label: "Home", icon: "🏠" },
        { id: "devmaestro", label: "DevMaestro", icon: "⚡" },
        { id: "thinkmaestro", label: "ThinkSpace", icon: "🧠" },
        { id: "wiredfront", label: "WiredFront", icon: "📡" },
        { id: "system", label: "System", icon: "⚙️" },
    ];
</script>

<nav class="sidebar-nav">
    <div
        class="logo-area"
        onclick={() => appState.toggleSidebar()}
        role="button"
        tabindex="0"
    >
        <!-- Activity Icon (Animated WebP) -->
        <img
            src={appState.activity_icon}
            alt="DevPulse Activity"
            class="activity-icon"
        />

        {#if appState.sidebar_expanded}
            <span class="logo-text">DevPulse</span>
        {/if}
    </div>

    <div class="nav-list">
        {#each navItems as item}
            <button
                class="nav-item"
                class:active={appState.current_view === item.id}
                onclick={() => appState.setView(item.id)}
            >
                <span class="icon">{item.icon}</span>
                {#if appState.sidebar_expanded}
                    <span class="label">{item.label}</span>
                {/if}
            </button>
        {/each}
    </div>

    <div class="sidebar-footer">
        {#if appState.sidebar_expanded}
            <div class="status-indicator online">Online</div>
        {/if}
    </div>
</nav>

<style>
    .sidebar-nav {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .logo-area {
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center; /* Centered when collapsed */
        cursor: pointer;
        padding-top: 0.5rem;
    }

    /* When expanded, align left with padding */
    :global(.shell-sidebar.expanded) .logo-area {
        justify-content: flex-start;
        padding-left: 1.5rem;
    }

    .logo-text {
        font-weight: 700;
        font-size: 1.2rem;
        background: linear-gradient(90deg, #fff, #a29fff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-left: 0.8rem;
    }

    .activity-icon {
        width: 32px;
        height: 32px;
        object-fit: contain;
        filter: drop-shadow(0 0 5px rgba(100, 149, 237, 0.5));
    }

    .nav-list {
        flex: 1;
        padding: 1rem 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .nav-item {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        display: flex;
        align-items: center;
        height: 40px;
        padding: 0 1rem; /* Fixed padding */
        cursor: pointer;
        transition: all 0.2s;
        justify-content: center;
    }

    :global(.shell-sidebar.expanded) .nav-item {
        justify-content: flex-start;
        padding-left: 1.5rem;
    }

    .nav-item:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.05);
    }

    .nav-item.active {
        color: #fff;
        background: rgba(100, 100, 255, 0.1);
        border-left: 3px solid #8e8aff;
    }

    .label {
        margin-left: 1rem;
        white-space: nowrap;
        font-size: 0.9rem;
    }

    .style-icon {
        font-size: 1.2rem;
    }
</style>
