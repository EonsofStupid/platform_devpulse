<!--
  @file src/lib/sys/debug/vpb/components/inspector/ScanTooltip.svelte
  @layer lib
  @description Hover tooltip with Source Map integration.
  @since 1.0.0
-->
<script lang="ts">
  import { scan } from "./state"; // Import local state

  interface Props {
    rect: DOMRect; // Passed from Overlay
  }

  let { rect }: Props = $props();

  const info = $derived(scan.elementInfo);

  // Position logic
  const tooltipBelow = $derived(rect.top < 80);
  const style = $derived.by(() => {
    const x = rect.left + rect.width / 2;
    // Add 12px gap
    const y = tooltipBelow ? rect.bottom + 12 : rect.top - 12;
    return `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            transform: translateX(-50%) translateY(${tooltipBelow ? "0" : "-100%"});
            z-index: var(--dp-vpb-z-tooltip);
        `;
  });
</script>

{#if info}
  <div class="vpb-tooltip" {style}>
    <!-- Tag & ID -->
    <div class="vpb-tooltip-header">
      <span class="vpb-tag">&lt;{info.tagName}&gt;</span>
      {#if info.id}<span class="vpb-id">#{info.id}</span>{/if}
    </div>

    <!-- Classes -->
    {#if info.classList.length > 0}
      <div class="vpb-classes">
        {#each info.classList as cls}
          <span class="vpb-class">.{cls}</span>
        {/each}
      </div>
    {/if}

    <!-- P0 FIX: Source Map Info -->
    {#if info.sourceFile}
      <div class="vpb-source">
        <span class="vpb-file-icon">📄</span>
        <span class="vpb-filename">{info.sourceFile}</span>
        {#if info.lineNumbers}
          <span class="vpb-line">:{info.lineNumbers.start}</span>
        {/if}
      </div>
    {/if}

    <!-- Dimensions -->
    <div class="vpb-dims">
      {Math.round(rect.width)} × {Math.round(rect.height)}
    </div>
  </div>
{/if}

<style>
  .vpb-tooltip {
    background: var(--dp-vpb-surface-base);
    border: 1px solid var(--dp-vpb-panel-border);
    border-radius: var(--dp-radius-md);
    padding: var(--dp-space-2) var(--dp-space-3);
    box-shadow: var(--dp-shadow-lg);
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 140px;
  }

  .vpb-tooltip-header {
    font-family: var(--dp-font-mono);
    font-size: var(--dp-text-xs);
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .vpb-tag {
    color: var(--dp-vpb-action-play);
  }
  .vpb-id {
    color: var(--dp-vpb-text-primary);
  }

  .vpb-classes {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    font-family: var(--dp-font-mono);
    font-size: 10px;
    color: var(--dp-teal-400);
  }

  .vpb-source {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid var(--dp-vpb-panel-border);
    font-family: var(--dp-font-mono);
    font-size: 10px;
    color: var(--dp-vpb-text-muted);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .vpb-dims {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    color: var(--dp-vpb-text-muted);
    white-space: nowrap;
  }
</style>
