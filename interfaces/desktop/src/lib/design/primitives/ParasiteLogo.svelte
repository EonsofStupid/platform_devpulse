<!--
  @file src/lib/design/primitives/ParasiteLogo.svelte
  @name ParasiteLogo.svelte
  @module @devpulse/design/primitives/ParasiteLogo
  @layer lib

  @description
  [TODO: Describe this component's purpose]

  @props
  - [TODO: propName]: [type] - [description]

  @dependencies
  - [TODO: List imports]

  @consumers
  - [TODO: List who uses this component]

  @vpb-editable [TODO: List editable props]
  @since 1.0.0
-->
<script lang="ts">
    /**
     * ParasiteLogo - DevPulse Brand Typography
     *
     * Features (from alpha pattern):
     * - Letters randomly shift colors (ice/fire/cyan/purple)
     * - Sporadic pulse line sweeps through text
     * - Deep glass container
     *
     * Uses composable tokens from design system.
     */
    import { onMount } from "svelte";

    interface Props {
        size?: "sm" | "md" | "lg";
    }

    let { size = "md" }: Props = $props();

    // Letter color states - each letter shifts independently
    let letterColors = $state([
        "base",
        "base",
        "base",
        "base",
        "base",
        "base",
        "base",
        "base",
    ]);
    const letters = ["D", "E", "V", "P", "U", "L", "S", "E"];
    const colorClasses = ["ice", "fire", "cyan", "purple", "base"];

    // Pulse line state
    let pulseActive = $state(false);

    // Random color shifts
    function shiftRandomLetter() {
        const idx = Math.floor(Math.random() * letters.length);
        const newColor =
            colorClasses[Math.floor(Math.random() * colorClasses.length)];
        letterColors[idx] = newColor;

        // Reset after delay
        setTimeout(
            () => {
                letterColors[idx] = "base";
            },
            800 + Math.random() * 1200,
        );
    }

    // Sporadic pulse activation
    function triggerPulse() {
        if (!pulseActive) {
            pulseActive = true;
            setTimeout(() => {
                pulseActive = false;
            }, 1200);
        }
    }

    onMount(() => {
        // Random letter color shifts (every 1-3 seconds)
        const colorInterval = setInterval(
            () => {
                if (Math.random() > 0.4) shiftRandomLetter();
            },
            1000 + Math.random() * 2000,
        );

        // Sporadic pulse (every 4-8 seconds)
        const pulseInterval = setInterval(
            () => {
                if (Math.random() > 0.3) triggerPulse();
            },
            4000 + Math.random() * 4000,
        );

        return () => {
            clearInterval(colorInterval);
            clearInterval(pulseInterval);
        };
    });
</script>

<div class="parasite-logo size-{size}">
    <div class="logo-text-container">
        <span class="logo-text">
            {#each letters as letter, i}
                <span
                    class="letter"
                    class:ice={letterColors[i] === "ice"}
                    class:fire={letterColors[i] === "fire"}
                    class:cyan={letterColors[i] === "cyan"}
                    class:purple={letterColors[i] === "purple"}>{letter}</span
                >
            {/each}
        </span>

        <!-- Pulse overlay -->
        <div class="pulse-line" class:active={pulseActive}></div>
    </div>
</div>

<style>
    /* Container - Deep glass (uses design system tokens) */
    .parasite-logo {
        display: inline-flex;
        align-items: center;
        position: relative;

        /* Glass surface - composable */
        background: var(--surface-glass-void);
        backdrop-filter: blur(var(--blur-lg));
        border: var(--border-soft);
        border-radius: var(--radius-md);
        box-shadow: var(--bevel-outset-soft), var(--shadow-z2);

        padding: var(--space-1) var(--space-3);
    }

    /* Size variants */
    .size-sm {
        padding: var(--space-1) var(--space-2);
    }
    .size-md {
        padding: var(--space-1) var(--space-3);
    }
    .size-lg {
        padding: var(--space-2) var(--space-4);
    }

    /* Text container */
    .logo-text-container {
        position: relative;
        overflow: hidden;
    }

    .logo-text {
        display: flex;
        font-weight: 800;
        letter-spacing: 0.15em;
        font-family: var(--font-sans);
    }

    .size-sm .logo-text {
        font-size: clamp(0.875rem, 1.5vw, 1rem);
    }
    .size-md .logo-text {
        font-size: clamp(1rem, 2vw, 1.25rem);
    }
    .size-lg .logo-text {
        font-size: clamp(1.25rem, 2.5vw, 1.5rem);
    }

    /* Individual letters - base state */
    .letter {
        display: inline-block;
        transition:
            color var(--duration-normal) var(--ease-out),
            text-shadow var(--duration-normal) var(--ease-out);
        color: var(--text-white);
    }

    /* Color states - OKLCH (aligned to design system signals) */
    .letter.ice {
        /* Ice = teal family (signal-teal) */
        color: oklch(75% 0.15 195);
        text-shadow: 0 0 12px oklch(70% 0.2 195 / 0.8);
    }

    .letter.fire {
        /* Fire = ember family (signal-ember) */
        color: oklch(75% 0.2 45);
        text-shadow: 0 0 12px oklch(70% 0.25 45 / 0.8);
    }

    .letter.cyan {
        /* Cyan = lighter teal */
        color: oklch(80% 0.15 190);
        text-shadow: 0 0 12px oklch(75% 0.2 190 / 0.8);
    }

    .letter.purple {
        /* Purple = signal-purple */
        color: oklch(70% 0.2 280);
        text-shadow: 0 0 12px oklch(65% 0.25 280 / 0.8);
    }

    /* Pulse line overlay */
    .pulse-line {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 20px;
        pointer-events: none;
        opacity: 0;
        transform: translateX(-100%);

        background: linear-gradient(
            90deg,
            transparent 0%,
            oklch(75% 0.25 45 / 0.6) 30%,
            oklch(90% 0.2 195 / 1) 50%,
            oklch(75% 0.25 195 / 0.6) 70%,
            transparent 100%
        );

        box-shadow:
            0 0 15px oklch(80% 0.2 195 / 0.8),
            0 0 30px oklch(70% 0.15 195 / 0.4);
    }

    .pulse-line.active {
        opacity: 1;
        animation: pulse-sweep 1s var(--ease-out) forwards;
    }

    @keyframes pulse-sweep {
        0% {
            transform: translateX(-100%);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateX(500%);
            opacity: 0;
        }
    }
</style>
