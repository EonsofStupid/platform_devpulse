<!--
  @file src/lib/layouts/app/Sidebar.svelte
  @name Sidebar.svelte
  @module @devpulse/layouts/app/Sidebar
  @layer lib

  @description
  Icon-only navigation sidebar with URL-driven routing

  @since 1.0.0
-->
<!--
    SIDEBAR.SVELTE - Icon-Only Navigation (URL-Driven)
    ===================================================
    - 64px width (icon-only mode)
    - Tooltip on hover (right side)
    - 4 random interaction animations
    - URL-driven navigation via <a> tags
-->
<script lang="ts">
    import { page } from '$app/state';

    interface NavItem {
        id: string;
        icon: string;
        label: string;
        href: string;
    }

    const navItems: NavItem[] = [
        { id: "devpulse", icon: "🏠", label: "Home", href: "/devpulse" },
        { id: "ui-demo", icon: "🎨", label: "UI Components", href: "/ui-demo" },
        { id: "overmind", icon: "🧠", label: "OverMind", href: "/overmind" },
        { id: "wiredfront", icon: "📡", label: "WiredFront", href: "/wiredfront" },
        { id: "devforge", icon: "🔧", label: "DevForge", href: "/devforge" },
        { id: "maestro", icon: "🎭", label: "Maestro", href: "/maestro" },
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
    }

    function isActive(href: string): boolean {
        return page.url.pathname.startsWith(href);
    }
</script>

<nav class="sidebar">
    <div class="nav-list">
        {#each navItems as item}
            <a
                href={item.href}
                class="nav-item"
                class:active={isActive(item.href)}
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
            </a>
        {/each}
    </div>
</nav>

<style>
    /* =============================================
       SIDEBAR - DEEP CHANNEL NAVIGATION
       Pattern: leftsidebar.ds.css
       ============================================= */
    .sidebar {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 12px 0;
    }

    .nav-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 0 8px;
    }

    /* =============================================
       NAV ITEM - NEON GLOW ON HOVER/ACTIVE
       ============================================= */
    .nav-item {
        position: relative;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        /* Invisible base */
        background: transparent;
        border: 1px solid transparent;
        border-radius: 10px;
        cursor: pointer;
        text-decoration: none;
        transition:
            transform 0.3s cubic-bezier(0.33, 1, 0.68, 1),
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
    }

    /* Hover - SWELL + NEON GLOW */
    .nav-item:hover {
        transform: scale(1.1);
        background: hsl(222 45% 14% / 0.9);
        border-color: hsl(191 100% 60% / 0.4);
        box-shadow:
            /* Crisp bevel */
            inset 1px 1px 0 hsl(0 0% 100% / 0.1),
            inset -1px -1px 0 hsl(0 0% 0% / 0.3),
            /* NEON GLOW */
            0 0 16px hsl(191 100% 60% / 0.35),
            /* Elevation */
            0 4px 12px hsl(0 0% 0% / 0.4);
    }

    /* Gradual return on mouse leave */
    .nav-item:not(:hover) {
        transition:
            transform 0.5s cubic-bezier(0.33, 1, 0.68, 1),
            background 0.3s ease,
            border-color 0.3s ease,
            box-shadow 0.3s ease;
    }

    /* Active - BRIGHT NEON + STRONG GLOW */
    .nav-item.active {
        background: hsl(222 40% 16% / 0.95);
        border-color: hsl(191 100% 60% / 0.6);
        box-shadow:
            /* Crisp bevel */
            inset 2px 2px 0 hsl(0 0% 100% / 0.12),
            inset -2px -2px 0 hsl(0 0% 0% / 0.3),
            /* STRONG NEON GLOW */
            0 0 24px hsl(191 100% 60% / 0.5),
            0 0 48px hsl(191 100% 60% / 0.25),
            /* Elevation */
            0 4px 16px hsl(0 0% 0% / 0.4);
    }

    /* Active indicator bar */
    .nav-item.active::after {
        content: '';
        position: absolute;
        left: 0;
        top: 25%;
        bottom: 25%;
        width: 3px;
        background: hsl(191 100% 60%);
        border-radius: 0 2px 2px 0;
        box-shadow: 0 0 12px hsl(191 100% 60% / 0.8);
    }

    /* =============================================
       NAV ICON - NEON GLOW EFFECT
       ============================================= */
    .nav-icon {
        font-size: 20px;
        color: hsl(0 0% 75%);
        transition:
            transform 0.2s cubic-bezier(0.33, 1, 0.68, 1),
            filter 0.2s ease,
            color 0.2s ease;
    }

    .nav-item:hover .nav-icon {
        color: hsl(191 100% 80%);
        filter: drop-shadow(0 0 8px hsl(191 100% 60% / 0.9));
    }

    .nav-item.active .nav-icon {
        color: hsl(191 100% 85%);
        filter: drop-shadow(0 0 10px hsl(191 100% 60%));
    }

    /* =============================================
       CLICK ANIMATIONS - MICRO-INTERACTIONS
       ============================================= */
    .nav-item.animating[data-animation="bounce"] .nav-icon {
        animation: icon-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .nav-item.animating[data-animation="spin"] .nav-icon {
        animation: icon-spin 0.5s cubic-bezier(0.33, 1, 0.68, 1);
    }
    .nav-item.animating[data-animation="pulse"] .nav-icon {
        animation: icon-pulse 0.5s cubic-bezier(0.65, 0, 0.35, 1);
    }
    .nav-item.animating[data-animation="shake"] .nav-icon {
        animation: icon-shake 0.5s cubic-bezier(0.33, 1, 0.68, 1);
    }

    @keyframes icon-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
    }
    @keyframes icon-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    @keyframes icon-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
    }
    @keyframes icon-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
    }

    /* =============================================
       TOOLTIP - DEEP GLASS + NEON BORDER
       ============================================= */
    .tooltip {
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-left: 12px;
        padding: 8px 14px;
        /* Deep glass */
        background: hsl(222 50% 9% / 0.95);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        /* Neon border */
        border: 1px solid hsl(191 100% 60% / 0.35);
        border-radius: 8px;
        /* Multi-layer shadow */
        box-shadow:
            /* Crisp bevel */
            inset 2px 2px 0 hsl(0 0% 100% / 0.08),
            inset -2px -2px 0 hsl(0 0% 0% / 0.3),
            /* Neon glow */
            0 0 16px hsl(191 100% 60% / 0.2),
            /* Elevation */
            0 6px 24px hsl(0 0% 0% / 0.5);
        color: hsl(0 0% 95%);
        font-size: 0.85rem;
        font-family: "Rajdhani", "Inter", system-ui, sans-serif;
        font-weight: 500;
        letter-spacing: 0.02em;
        white-space: nowrap;
        pointer-events: none;
        z-index: 1000;
        animation: tooltip-in 150ms cubic-bezier(0.33, 1, 0.68, 1);
    }

    /* Tooltip arrow - neon tinted */
    .tooltip::before {
        content: "";
        position: absolute;
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        border: 6px solid transparent;
        border-right-color: hsl(222 50% 9% / 0.95);
        filter: drop-shadow(-2px 0 4px hsl(191 100% 60% / 0.2));
    }

    @keyframes tooltip-in {
        from {
            opacity: 0;
            transform: translateY(-50%) translateX(-6px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(-50%) translateX(0) scale(1);
        }
    }
</style>
