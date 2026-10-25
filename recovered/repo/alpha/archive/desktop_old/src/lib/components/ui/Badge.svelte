<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'default' | 'success' | 'warning' | 'error' | 'accent';

  let {
    variant = 'default',
    class: className = '',
    children,
  }: {
    variant?: Variant;
    class?: string;
    children?: Snippet;
  } = $props();
</script>

<span class="badge badge-{variant} {className}">
  {#if children}
    {@render children()}
  {/if}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: var(--radius-full);
    backdrop-filter: blur(8px);
    letter-spacing: 0.01em;
  }

  .badge-default {
    background: rgba(130, 111, 214, 0.2);
    color: var(--foreground);
    border: 1px solid rgba(130, 111, 214, 0.3);
  }

  .badge-success {
    background: rgba(0, 184, 122, 0.2);
    color: var(--chart-2);
    border: 1px solid rgba(0, 184, 122, 0.3);
    box-shadow: 0 0 8px rgba(0, 184, 122, 0.2);
  }

  .badge-warning {
    background: rgba(247, 185, 40, 0.2);
    color: var(--chart-3);
    border: 1px solid rgba(247, 185, 40, 0.3);
    box-shadow: 0 0 8px rgba(247, 185, 40, 0.2);
  }

  .badge-error {
    background: rgba(186, 201, 75, 0.2);
    color: var(--destructive);
    border: 1px solid rgba(186, 201, 75, 0.3);
    box-shadow: 0 0 8px rgba(186, 201, 75, 0.2);
  }

  .badge-accent {
    background: rgba(127, 47, 168, 0.3);
    color: var(--primary-foreground);
    border: 1px solid rgba(127, 47, 168, 0.4);
    box-shadow: 0 0 8px rgba(127, 47, 168, 0.3);
  }
</style>
