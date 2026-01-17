<script lang="ts">
    import { global } from "$lib/sys/runes/global.svelte";

    // Navigation Data
    const navItems = [
        { id: "devpulse", label: "Home", icon: "🏠" },
        { id: "devmaestro", label: "DevMaestro", icon: "⚡" },
        { id: "overmind", label: "ThinkSpace", icon: "🧠" },
        { id: "wiredfront", label: "WiredFront", icon: "📡" },
        { id: "system", label: "System", icon: "⚙️" },
    ];
</script>

<nav class="sidebar-nav">
    <div
        class="logo-area"
        onclick={() => global.toggleSidebar()}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === "Enter" && global.toggleSidebar()}
    >
        <!-- Activity Icon (Animated WebP) -->
        <div class="activity-cube"></div>

        {#if global.sidebar_expanded}
            <span class="logo-text">DevPulse</span>
        {/if}
    </div>

    <div class="nav-list">
        {#each navItems as item}
            <button
                class="nav-item"
                class:active={global.current_domain === item.id}
                onclick={() => global.setDomain(item.id)}
            >
                <span class="icon">{item.icon}</span>
                {#if global.sidebar_expanded}
                    <span class="label">{item.label}</span>
                {/if}
            </button>
        {/each}
    </div>

    <div class="sidebar-footer">
        {#if global.sidebar_expanded}
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

    .activity-cube {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #00ffcc, #9900ff);
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(0, 255, 204, 0.5);
        animation: pulse 4s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 0.8;
        }
        50% {
            transform: scale(1.1);
            opacity: 1;
        }
        100% {
            transform: scale(1);
            opacity: 0.8;
        }
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
</style>
