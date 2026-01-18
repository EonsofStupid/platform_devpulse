<!--
    SIDEBAR.SVELTE - Icon-Only Navigation
    ======================================
    - 64px width (icon-only mode)
    - Tooltip on hover (right side)
    - 4 random interaction animations
    - Seamless internal scroll
-->
<script lang="ts">
    import { global } from "$lib/sys/runes/global.svelte";

    interface NavItem {
        id: string;
        icon: string;
        label: string;
        active?: boolean;
    }

    const navItems: NavItem[] = [
        { id: "devpulse", icon: "🏠", label: "Home", active: true },
        { id: "ui-demo", icon: "🎨", label: "UI Components" },
        { id: "overmind", icon: "🧠", label: "OverMind" },
        { id: "wiredfront", icon: "📡", label: "WiredFront" },
        { id: "settings", icon: "⚙️", label: "Settings" },
    ];

    // Animation variants for icon interaction
    const animations = ["bounce", "spin", "pulse", "shake"];

    function getRandomAnimation(): string {
        return animations[Math.floor(Math.random() * animations.length)];
    }

    let hoveredItem = $state<string | null>(null);
    let animatingItem = $state<string | null>(null);
    let currentAnimation = $state<string>("");

    function handleMouseEnter(id: string) {
        hoveredItem = id;
    }

    function handleMouseLeave() {
        hoveredItem = null;
    }

    function handleClick(id: string) {
        animatingItem = id;
        currentAnimation = getRandomAnimation();
        setTimeout(() => {
            animatingItem = null;
        }, 500);
        // Navigate to domain
        global.setDomain(id);
    }
</script>

<nav class="sidebar">
    <div class="nav-list">
        {#each navItems as item}
            <button
                class="nav-item"
                class:active={item.active}
                class:animating={animatingItem === item.id}
                data-animation={animatingItem === item.id
                    ? currentAnimation
                    : ""}
                onmouseenter={() => handleMouseEnter(item.id)}
                onmouseleave={handleMouseLeave}
                onclick={() => handleClick(item.id)}
            >
                <span class="nav-icon">{item.icon}</span>

                {#if hoveredItem === item.id}
                    <div class="tooltip">
                        {item.label}
                    </div>
                {/if}
            </button>
        {/each}
    </div>
</nav>

<style>
    .sidebar {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: var(--space-2) 0;
    }

    .nav-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        padding: 0 var(--space-2);
    }

    .nav-item {
        position: relative;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--duration-normal) var(--ease-out);
    }

    .nav-item:hover {
        background: var(--surface-glass-smoke);
        border-color: var(--bevel-light-subtle);
        box-shadow: var(--bevel-outset-subtle);
    }

    .nav-item.active {
        background: var(--surface-glass-frost);
        border-color: var(--signal-teal);
        box-shadow: var(--bevel-outset-soft), var(--shadow-glow-teal);
    }

    .nav-icon {
        font-size: 20px;
        transition: transform var(--duration-fast) var(--ease-out);
    }

    /* Interaction Animations */
    .nav-item.animating[data-animation="bounce"] .nav-icon {
        animation: icon-bounce 0.5s var(--ease-bounce);
    }
    .nav-item.animating[data-animation="spin"] .nav-icon {
        animation: icon-spin 0.5s var(--ease-out);
    }
    .nav-item.animating[data-animation="pulse"] .nav-icon {
        animation: icon-pulse 0.5s var(--ease-in-out);
    }
    .nav-item.animating[data-animation="shake"] .nav-icon {
        animation: icon-shake 0.5s var(--ease-out);
    }

    @keyframes icon-bounce {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-8px);
        }
    }
    @keyframes icon-spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    @keyframes icon-pulse {
        0%,
        100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.3);
        }
    }
    @keyframes icon-shake {
        0%,
        100% {
            transform: translateX(0);
        }
        25% {
            transform: translateX(-4px);
        }
        75% {
            transform: translateX(4px);
        }
    }

    /* Tooltip */
    .tooltip {
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-left: var(--space-2);
        padding: var(--space-1) var(--space-3);
        background: var(--surface-glass-void);
        backdrop-filter: blur(var(--blur-lg));
        border: var(--border-soft);
        border-radius: var(--radius-md);
        box-shadow: var(--bevel-outset-soft), var(--shadow-z3);
        color: var(--text-white);
        font-size: var(--text-sm);
        font-family: var(--font-sans);
        white-space: nowrap;
        pointer-events: none;
        z-index: 1000;
        animation: fade-in var(--duration-fast) var(--ease-out);
    }

    .tooltip::before {
        content: "";
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        border: 6px solid transparent;
        border-right-color: var(--surface-glass-void);
    }
</style>
