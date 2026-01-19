<!--
  @file src/lib/design/primitives/ParasiteLogo.svelte
  @layer primitives

  @description
  DevPulse brand typography component with animated letter color shifts.
  Features random color shifts (teal/ember/purple) and sporadic pulse sweep.
  Uses COLD LIGHT design system tokens.

  @props
  - size: "sm" | "md" | "lg" - Logo size

  @vpb-editable size
  @since 1.0.0
-->
<script lang="ts">
    import { onMount } from "svelte";

    interface Props {
        /** Logo size (VPB dropdown) */
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
    const colorClasses = ["teal", "ember", "cyan", "purple", "base"];

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

<div class="dp-parasite-logo" data-size={size}>
    <div class="dp-parasite-logo__text-container">
        <span class="dp-parasite-logo__text">
            {#each letters as letter, i}
                <span
                    class="dp-parasite-logo__letter"
                    data-color={letterColors[i]}
                >{letter}</span>
            {/each}
        </span>

        <!-- Pulse overlay -->
        <div class="dp-parasite-logo__pulse" data-active={pulseActive}></div>
    </div>
</div>

<style>
    /* Container - Deep glass */
    .dp-parasite-logo {
        display: inline-flex;
        align-items: center;
        position: relative;
        background: var(--dp-glass-void);
        backdrop-filter: blur(var(--dp-blur-lg));
        -webkit-backdrop-filter: blur(var(--dp-blur-lg));
        border: var(--dp-border-soft);
        border-radius: var(--dp-radius-md);
        box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z2);
    }

    /* Size variants */
    .dp-parasite-logo[data-size="sm"] {
        padding: var(--dp-space-1) var(--dp-space-2);
    }
    .dp-parasite-logo[data-size="md"] {
        padding: var(--dp-space-1) var(--dp-space-3);
    }
    .dp-parasite-logo[data-size="lg"] {
        padding: var(--dp-space-2) var(--dp-space-4);
    }

    /* Text container */
    .dp-parasite-logo__text-container {
        position: relative;
        overflow: hidden;
    }

    .dp-parasite-logo__text {
        display: flex;
        font-weight: 800;
        letter-spacing: 0.15em;
        font-family: var(--dp-font-sans);
    }

    .dp-parasite-logo[data-size="sm"] .dp-parasite-logo__text {
        font-size: var(--dp-text-sm);
    }
    .dp-parasite-logo[data-size="md"] .dp-parasite-logo__text {
        font-size: var(--dp-text-base);
    }
    .dp-parasite-logo[data-size="lg"] .dp-parasite-logo__text {
        font-size: var(--dp-text-xl);
    }

    /* Individual letters - base state */
    .dp-parasite-logo__letter {
        display: inline-block;
        transition: color var(--dp-transition-normal), text-shadow var(--dp-transition-normal);
        color: var(--dp-text-white);
    }

    /* Color states - using design system hues */
    .dp-parasite-logo__letter[data-color="teal"] {
        color: var(--dp-teal-300);
        text-shadow: 0 0 12px oklch(70% 0.18 var(--dp-hue-teal) / 0.8);
    }
    .dp-parasite-logo__letter[data-color="ember"] {
        color: var(--dp-ember-300);
        text-shadow: 0 0 12px oklch(70% 0.20 var(--dp-hue-ember) / 0.8);
    }
    .dp-parasite-logo__letter[data-color="cyan"] {
        color: var(--dp-teal-200);
        text-shadow: 0 0 12px oklch(75% 0.15 var(--dp-hue-teal) / 0.8);
    }
    .dp-parasite-logo__letter[data-color="purple"] {
        color: var(--dp-purple-300);
        text-shadow: 0 0 12px oklch(65% 0.20 var(--dp-hue-purple) / 0.8);
    }

    /* Pulse line overlay */
    .dp-parasite-logo__pulse {
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
            oklch(75% 0.20 var(--dp-hue-ember) / 0.6) 30%,
            oklch(90% 0.15 var(--dp-hue-teal) / 1) 50%,
            oklch(75% 0.20 var(--dp-hue-teal) / 0.6) 70%,
            transparent 100%
        );
        box-shadow:
            0 0 15px oklch(80% 0.18 var(--dp-hue-teal) / 0.8),
            0 0 30px oklch(70% 0.15 var(--dp-hue-teal) / 0.4);
    }

    .dp-parasite-logo__pulse[data-active="true"] {
        opacity: 1;
        animation: dp-pulse-sweep 1s var(--dp-ease-out) forwards;
    }

    @keyframes dp-pulse-sweep {
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
