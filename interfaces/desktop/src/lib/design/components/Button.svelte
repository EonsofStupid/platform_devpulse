<!--
    Button - Core interactive element
    ARIA: native button semantics
    Uses OKLCH tokens only
-->
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        variant?: 'primary' | 'secondary' | 'ghost';
        size?: 'sm' | 'md' | 'lg';
        glow?: boolean;
        disabled?: boolean;
        class?: string;
        onclick?: () => void;
        children: Snippet;
    }

    let {
        variant = 'primary',
        size = 'md',
        glow = false,
        disabled = false,
        class: className = '',
        onclick,
        children
    }: Props = $props();
</script>

<button
    class="btn variant-{variant} size-{size}"
    class:glow
    class={className}
    {disabled}
    {onclick}
>
    {@render children()}
</button>

<style>
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        font-family: var(--font-sans);
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
    }

    .btn:disabled {
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
        padding: var(--space-2) var(--space-4);
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
        background: linear-gradient(135deg, var(--purple-500), var(--pink-500));
        color: var(--text-primary);
        box-shadow: var(--shadow-z2);
    }
    .variant-primary:hover:not(:disabled) {
        box-shadow: var(--shadow-z3), var(--glow-purple);
        transform: translateY(-1px);
    }

    .variant-secondary {
        background: var(--glass-deep);
        backdrop-filter: blur(var(--blur-md));
        color: var(--text-primary);
        border: var(--border-soft);
        box-shadow: var(--bevel-outset);
    }
    .variant-secondary:hover:not(:disabled) {
        background: var(--glass-smoke);
        box-shadow: var(--bevel-outset), var(--glow-teal);
    }

    .variant-ghost {
        background: transparent;
        color: var(--text-secondary);
    }
    .variant-ghost:hover:not(:disabled) {
        background: var(--glass-frost);
        color: var(--text-primary);
    }

    /* Glow modifier */
    .glow {
        box-shadow: var(--shadow-z2), var(--glow-teal);
    }
</style>
