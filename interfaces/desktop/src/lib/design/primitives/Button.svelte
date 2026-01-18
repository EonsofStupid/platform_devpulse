<!--
    Button.svelte - Custom ARIA Button Primitive
    
    Headless button with proper accessibility:
    - Native <button> or <a> semantics
    - aria-disabled support
    - Keyboard handling
    - Accepts any styling via class prop
-->
<script lang="ts">
    import type { Snippet } from "svelte";
    import type {
        HTMLButtonAttributes,
        HTMLAnchorAttributes,
    } from "svelte/elements";

    interface Props {
        /** Visual variant - applied as data attribute for styling */
        variant?: "default" | "primary" | "ghost" | "destructive";
        /** Size variant */
        size?: "sm" | "md" | "lg" | "icon";
        /** Render as anchor link */
        href?: string;
        /** Disabled state */
        disabled?: boolean;
        /** Loading state */
        loading?: boolean;
        /** Additional CSS classes */
        class?: string;
        /** Click handler */
        onclick?: (event: MouseEvent) => void;
        /** Content */
        children: Snippet;
    }

    let {
        variant = "default",
        size = "md",
        href,
        disabled = false,
        loading = false,
        class: className = "",
        onclick,
        children,
    }: Props = $props();

    const isDisabled = $derived(disabled || loading);
</script>

{#if href && !isDisabled}
    <a
        {href}
        class="dp-button {className}"
        data-variant={variant}
        data-size={size}
        data-loading={loading || undefined}
        role="button"
    >
        {#if loading}
            <span class="dp-button-spinner" aria-hidden="true"></span>
        {/if}
        <span class="dp-button-content">
            {@render children()}
        </span>
    </a>
{:else}
    <button
        type="button"
        class="dp-button {className}"
        data-variant={variant}
        data-size={size}
        data-loading={loading || undefined}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        onclick={isDisabled ? undefined : onclick}
    >
        {#if loading}
            <span class="dp-button-spinner" aria-hidden="true"></span>
        {/if}
        <span class="dp-button-content">
            {@render children()}
        </span>
    </button>
{/if}

<style>
    /* Base button - minimal styling, inherits from glass classes */
    .dp-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--dp-space-2);
        border: none;
        background: none;
        padding: 0;
        cursor: pointer;
        font: inherit;
        color: inherit;
        text-decoration: none;
        transition: all var(--dp-transition-fast);
        position: relative;
    }

    .dp-button:disabled,
    .dp-button[aria-disabled="true"] {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .dp-button-content {
        display: inline-flex;
        align-items: center;
        gap: var(--dp-space-2);
    }

    .dp-button[data-loading="true"] .dp-button-content {
        opacity: 0;
    }

    /* Loading spinner */
    .dp-button-spinner {
        position: absolute;
        width: 1em;
        height: 1em;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* Size variants */
    .dp-button[data-size="sm"] {
        padding: var(--dp-space-1) var(--dp-space-3);
        font-size: var(--dp-text-xs);
    }
    .dp-button[data-size="md"] {
        padding: var(--dp-space-2) var(--dp-space-4);
        font-size: var(--dp-text-sm);
    }
    .dp-button[data-size="lg"] {
        padding: var(--dp-space-3) var(--dp-space-6);
        font-size: var(--dp-text-base);
    }
    .dp-button[data-size="icon"] {
        padding: var(--dp-space-2);
        aspect-ratio: 1;
    }
</style>
