<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    class: className = '',
    hoverable = false,
    children,
    header,
    footer,
  }: {
    class?: string;
    hoverable?: boolean;
    children?: Snippet;
    header?: Snippet;
    footer?: Snippet;
  } = $props();
</script>

<div class="card {className}" class:hoverable>
  {#if header}
    <div class="card-header">
      {@render header()}
    </div>
  {/if}

  <div class="card-content">
    {#if children}
      {@render children()}
    {/if}
  </div>

  {#if footer}
    <div class="card-footer">
      {@render footer()}
    </div>
  {/if}
</div>

<style>
  .card {
    background: linear-gradient(
      145deg,
      rgba(28, 26, 71, 0.8) 0%,
      var(--card) 100%
    );
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.1),
      inset 0 -1px 1px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .card.hoverable {
    transition: all var(--transition-normal);
  }

  .card.hoverable:hover {
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.4),
      0 0 30px rgba(127, 47, 168, 0.15),
      inset 0 1px 2px rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    border-color: rgba(130, 111, 214, 0.5);
  }

  .card-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(130, 111, 214, 0.2);
  }

  .card-content {
    padding: 1.5rem;
    color: var(--card-foreground);
  }

  .card-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid rgba(130, 111, 214, 0.2);
    background: rgba(0, 0, 0, 0.1);
  }
</style>
