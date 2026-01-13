<script lang="ts">
  import type { Snippet } from 'svelte';

  type Variant = 'default' | 'subtle' | 'intense';

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

<div class="panel panel-{variant} {className}">
  {#if children}
    {@render children()}
  {/if}
</div>

<style>
  .panel {
    padding: 1rem;
    border-radius: var(--radius);
  }

  .panel-default {
    background: linear-gradient(
      135deg,
      var(--glass-bg-start) 0%,
      var(--glass-bg-end) 100%
    );
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid var(--glass-border);
    box-shadow:
      inset 0 1px 1px rgba(255, 255, 255, 0.1),
      inset 0 -1px 1px rgba(0, 0, 0, 0.2);
  }

  .panel-subtle {
    background: linear-gradient(
      135deg,
      rgba(28, 26, 71, 0.4) 0%,
      rgba(36, 3, 54, 0.3) 100%
    );
    backdrop-filter: blur(8px) saturate(150%);
    -webkit-backdrop-filter: blur(8px) saturate(150%);
    border: 1px solid rgba(130, 111, 214, 0.2);
  }

  .panel-intense {
    background: linear-gradient(
      135deg,
      rgba(28, 26, 71, 0.85) 0%,
      rgba(36, 3, 54, 0.75) 100%
    );
    backdrop-filter: blur(20px) saturate(200%);
    -webkit-backdrop-filter: blur(20px) saturate(200%);
    border: 1px solid rgba(130, 111, 214, 0.5);
    box-shadow:
      0 0 30px rgba(127, 47, 168, 0.25),
      inset 0 1px 2px rgba(255, 255, 255, 0.1),
      inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  }
</style>
