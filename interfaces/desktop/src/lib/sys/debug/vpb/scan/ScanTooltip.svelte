<!--
  ScanTooltip.svelte
  Tooltip showing element info on hover - uses recipes from lib/design/vpb-overlay.css
-->
<script lang="ts">
  interface Props {
    element: HTMLElement;
    rect: DOMRect;
  }
  
  let { element, rect }: Props = $props();
  
  // Position tooltip above or below element
  const tooltipBelow = $derived(rect.top < 60);
  
  const tooltipStyle = $derived(() => {
    const x = rect.left + rect.width / 2;
    const y = tooltipBelow ? rect.bottom + 8 : rect.top - 8;
    return `left: ${x}px; top: ${y}px; transform: translateX(-50%) translateY(${tooltipBelow ? '0' : '-100%'});`;
  });
  
  // Extract element info
  const tagName = $derived(element.tagName.toLowerCase());
  const classList = $derived(Array.from(element.classList).join(' '));
  const idAttr = $derived(element.id);
</script>

<div 
  class="vpb-tooltip"
  class:vpb-tooltip--below={tooltipBelow}
  style={tooltipStyle()}
>
  <span class="vpb-tooltip__tag">&lt;{tagName}&gt;</span>
  
  {#if classList}
    <span class="vpb-tooltip__class">.{classList.split(' ').join('.')}</span>
  {/if}
  
  {#if idAttr}
    <span class="vpb-tooltip__id">#{idAttr}</span>
  {/if}
</div>
