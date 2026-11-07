<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    header?: Snippet;
    messages?: Snippet;
    input?: Snippet;
  }

  let { header, messages, input }: Props = $props();
</script>

<div class="chat-frame">
  {#if header}
    <header class="chat-header glass-deep">
      {@render header()}
    </header>
  {/if}

  <div class="chat-messages">
    {#if messages}{@render messages()}{/if}
  </div>

  <div class="chat-input glass">
    {#if input}{@render input()}{/if}
  </div>
</div>

<style>
  .chat-frame {
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: var(--dp-radius-lg);
    overflow: hidden;
  }

  .chat-header {
    flex-shrink: 0;
    padding: var(--dp-space-3) var(--dp-space-4);
    border-bottom: 1px solid var(--dp-glass-border);
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--dp-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--dp-space-3);
  }

  .chat-input {
    flex-shrink: 0;
    padding: var(--dp-space-3) var(--dp-space-4);
    border-top: 1px solid var(--dp-glass-border);
  }

  /* Scrollbar styling */
  .chat-messages::-webkit-scrollbar {
    width: 6px;
  }

  .chat-messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-messages::-webkit-scrollbar-thumb {
    background: var(--dp-glass-border);
    border-radius: var(--dp-radius-full);
  }

  .chat-messages::-webkit-scrollbar-thumb:hover {
    background: var(--dp-glass-border-bright);
  }
</style>
