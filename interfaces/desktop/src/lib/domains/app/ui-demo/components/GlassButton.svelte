<!--
  @file src/lib/domains/app/ui-demo/components/GlassButton.svelte
  @name GlassButton.svelte
  @module @devpulse/domains/app/ui-demo/components/GlassButton
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
<!--
    GlassButton - Deep glass with colored shadows
-->
<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
	variant?: "primary" | "secondary" | "ghost";
	size?: "sm" | "md" | "lg";
	glow?: "none" | "teal" | "purple" | "blue";
	disabled?: boolean;
	onclick?: () => void;
	children: Snippet;
}

let {
	variant = "primary",
	size = "md",
	glow = "none",
	disabled = false,
	onclick,
	children,
}: Props = $props();
</script>

<button
    class="glass-btn variant-{variant} size-{size} glow-{glow}"
    {disabled}
    {onclick}
>
    <span class="btn-content">
        {@render children()}
    </span>
</button>

<style>
    .glass-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-sans);
        font-weight: 600;
        color: var(--text-primary);
        border: none;
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
        overflow: hidden;
    }

    .glass-btn::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        border: var(--border-rise-subtle);
        pointer-events: none;
    }

    .btn-content {
        position: relative;
        z-index: 1;
    }

    .glass-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Sizes */
    .size-sm {
        padding: var(--space-1) var(--space-3);
        font-size: var(--text-sm);
        border-radius: var(--radius-sm);
    }
    .size-md {
        padding: var(--space-2) var(--space-5);
        font-size: var(--text-base);
        border-radius: var(--radius-md);
    }
    .size-lg {
        padding: var(--space-3) var(--space-6);
        font-size: var(--text-lg);
        border-radius: var(--radius-lg);
    }

    /* Variants */
    .variant-primary {
        background: linear-gradient(
            135deg,
            var(--purple-600) 0%,
            var(--purple-500) 50%,
            var(--teal-600) 100%
        );
        background-size: 200% 200%;
        box-shadow: var(--bevel-raised), var(--shadow-purple-2);
        animation: subtle-pulse 4s ease-in-out infinite;
    }
    .variant-primary:hover:not(:disabled) {
        background-position: 100% 100%;
        box-shadow: var(--bevel-raised-deep), var(--shadow-purple-3);
        transform: translateY(-2px);
    }

    .variant-secondary {
        background: var(--glass-standard);
        backdrop-filter: blur(var(--glass-standard-blur));
        box-shadow: var(--bevel-raised);
    }
    .variant-secondary:hover:not(:disabled) {
        background: var(--glass-light);
        box-shadow: var(--bevel-raised-deep);
    }

    .variant-ghost {
        background: transparent;
        color: var(--text-secondary);
    }
    .variant-ghost:hover:not(:disabled) {
        background: var(--glass-frost);
        color: var(--text-primary);
    }

    /* Glows */
    .glow-teal {
        box-shadow: var(--bevel-raised), var(--glow-teal);
    }
    .glow-purple {
        box-shadow: var(--bevel-raised), var(--glow-purple);
    }
    .glow-blue {
        box-shadow: var(--bevel-raised), var(--glow-blue);
    }

    .glow-teal:hover,
    .glow-purple:hover,
    .glow-blue:hover {
        transform: translateY(-2px);
    }
</style>
