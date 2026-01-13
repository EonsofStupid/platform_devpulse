<script lang="ts">
  export let events: Array<{
    time: string;
    message: string;
    type: 'system' | 'ai' | 'user' | 'file';
  }> = [];

  const typeIcons: Record<string, string> = {
    system: '⚡',
    ai: '🤖',
    user: '👤',
    file: '📄'
  };
</script>

<div class="pulse-feed">
  <div class="feed-header">
    <span class="pulse-icon">📡</span>
    <span class="feed-title">PULSE FEED</span>
    <span class="live-badge">
      <span class="live-dot"></span>
      LIVE
    </span>
  </div>
  <div class="feed-list">
    {#if events.length === 0}
      <div class="feed-empty">No activity yet...</div>
    {:else}
      {#each events as event}
        <div class="feed-item type-{event.type}">
          <span class="feed-icon">{typeIcons[event.type] || '•'}</span>
          <div class="feed-content">
            <span class="feed-time">[{event.time}]</span>
            <span class="feed-message">{event.message}</span>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .pulse-feed {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-radius: 0.75rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .feed-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(6, 182, 212, 0.1);
    border-bottom: 1px solid rgba(6, 182, 212, 0.2);
    flex-shrink: 0;
  }

  .pulse-icon {
    font-size: 1rem;
  }

  .feed-title {
    font-weight: 600;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    color: #06b6d4;
    flex: 1;
  }

  .live-badge {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: #22c55e;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 8px #22c55e;
    animation: pulse-glow 1s ease-in-out infinite;
  }

  .feed-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .feed-empty {
    padding: 1rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
    font-style: italic;
  }

  .feed-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    margin-bottom: 0.25rem;
    border-left: 2px solid transparent;
    transition: background 0.15s ease;
  }

  .feed-item:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .type-system { border-left-color: #f59e0b; }
  .type-ai { border-left-color: #8b5cf6; }
  .type-user { border-left-color: #06b6d4; }
  .type-file { border-left-color: #22c55e; }

  .feed-icon {
    font-size: 0.75rem;
    width: 20px;
    flex-shrink: 0;
  }

  .feed-content {
    flex: 1;
    min-width: 0;
  }

  .feed-time {
    font-family: monospace;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    margin-right: 0.375rem;
  }

  .feed-message {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    word-break: break-word;
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }

  /* Scrollbar styling */
  .feed-list::-webkit-scrollbar {
    width: 4px;
  }
  .feed-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .feed-list::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.3);
    border-radius: 2px;
  }
  .feed-list::-webkit-scrollbar-thumb:hover {
    background: rgba(6, 182, 212, 0.5);
  }
</style>
