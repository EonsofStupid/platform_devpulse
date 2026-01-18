<!--
  @file src/lib/design/primitives/Dialog.svelte
  @name Dialog.svelte
  @module @devpulse/design/primitives/Dialog
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
    Dialog.svelte - Custom ARIA Dialog/Modal Primitive
    
    WAI-ARIA compliant modal:
    - role="dialog"
    - aria-modal="true"
    - Focus trap
    - Escape to close
-->
<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Open state */
        open?: boolean;
        /** Dialog title for aria-labelledby */
        title?: string;
        /** Close handler */
        onclose?: () => void;
        /** Additional CSS class */
        class?: string;
        /** Dialog content */
        children: Snippet;
    }

    let {
        open = $bindable(false),
        title = "",
        onclose,
        class: className = "",
        children,
    }: Props = $props();

    let dialogRef: HTMLElement | null = $state(null);

    function close() {
        open = false;
        onclose?.();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.preventDefault();
            close();
        }
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            close();
        }
    }

    // Focus trap on open
    $effect(() => {
        if (open && dialogRef) {
            const focusable = dialogRef.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            if (focusable.length > 0) {
                focusable[0].focus();
            }
        }
    });
</script>

{#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="dp-dialog-backdrop"
        onclick={handleBackdropClick}
        onkeydown={handleKeydown}
    >
        <div
            bind:this={dialogRef}
            class="dp-dialog {className}"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "dialog-title" : undefined}
        >
            {#if title}
                <div class="dp-dialog-header">
                    <h2 id="dialog-title" class="dp-dialog-title">{title}</h2>
                    <button
                        type="button"
                        class="dp-dialog-close"
                        aria-label="Close dialog"
                        onclick={close}
                    >
                        ✕
                    </button>
                </div>
            {/if}
            <div class="dp-dialog-content">
                {@render children()}
            </div>
        </div>
    </div>
{/if}

<style>
    .dp-dialog-backdrop {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: var(--dp-z-modal);
        animation: fade-in 0.2s ease-out;
    }

    @keyframes fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .dp-dialog {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
        animation: slide-up 0.3s var(--dp-ease-out);
    }

    @keyframes slide-up {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .dp-dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--dp-space-4);
        border-bottom: 1px solid oklch(35% 0.05 195 / 0.3);
    }

    .dp-dialog-title {
        margin: 0;
        font-size: var(--dp-text-lg);
        font-weight: var(--dp-font-semibold);
        color: var(--dp-text-primary);
    }

    .dp-dialog-close {
        background: none;
        border: none;
        color: var(--dp-text-muted);
        font-size: 1.25rem;
        cursor: pointer;
        padding: var(--dp-space-1);
        border-radius: var(--dp-radius-sm);
        transition: all var(--dp-transition-fast);
    }

    .dp-dialog-close:hover {
        color: var(--dp-text-primary);
        background: oklch(20% 0.02 195 / 0.5);
    }

    .dp-dialog-close:focus-visible {
        outline: 2px solid var(--dp-teal-400);
    }

    .dp-dialog-content {
        padding: var(--dp-space-4);
    }
</style>
