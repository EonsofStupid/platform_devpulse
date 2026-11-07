<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
  type Size = 'sm' | 'md' | 'lg';

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    class: className = '',
    children,
    onclick,
    ...rest
  }: {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    class?: string;
    children?: Snippet;
    onclick?: (e: MouseEvent) => void;
    [key: string]: any;
  } = $props();
</script>

<button
  {type}
  {disabled}
  class="btn btn-{variant} btn-{size} {className}"
  onclick={onclick}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: var(--font-sans);
    font-weight: 500;
    line-height: 1;
    border-radius: var(--radius);
    transition: all var(--transition-normal);
    cursor: pointer;
    border: 1px solid transparent;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Sizes */
  .btn-sm {
    padding: 0.5rem 0.875rem;
    font-size: 0.75rem;
  }

  .btn-md {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }

  .btn-lg {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  /* Primary */
  .btn-primary {
    background: linear-gradient(
      135deg,
      var(--accent) 0%,
      rgba(127, 47, 168, 0.8) 100%
    );
    color: var(--primary-foreground);
    border-color: rgba(130, 111, 214, 0.4);
    box-shadow:
      0 2px 8px rgba(127, 47, 168, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.15);
  }

  .btn-primary:hover:not(:disabled) {
    box-shadow:
      0 4px 16px rgba(127, 47, 168, 0.4),
      inset 0 1px 1px rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
    box-shadow:
      0 1px 4px rgba(127, 47, 168, 0.2),
      inset 0 2px 3px rgba(0, 0, 0, 0.2);
  }

  /* Secondary */
  .btn-secondary {
    background: var(--glass-bg-start);
    color: var(--foreground);
    border-color: var(--glass-border);
    backdrop-filter: blur(8px);
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.05);
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(28, 26, 71, 0.9);
    border-color: var(--border);
  }

  /* Ghost */
  .btn-ghost {
    background: transparent;
    color: var(--foreground);
  }

  .btn-ghost:hover:not(:disabled) {
    background: rgba(130, 111, 214, 0.1);
    border-color: rgba(130, 111, 214, 0.2);
  }

  /* Destructive */
  .btn-destructive {
    background: linear-gradient(
      135deg,
      rgba(186, 201, 75, 0.2) 0%,
      rgba(186, 201, 75, 0.1) 100%
    );
    color: var(--destructive);
    border-color: rgba(186, 201, 75, 0.3);
  }

  .btn-destructive:hover:not(:disabled) {
    background: rgba(186, 201, 75, 0.3);
    border-color: rgba(186, 201, 75, 0.5);
  }
</style>
