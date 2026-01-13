<script lang="ts">
  export let name: string = 'Guardian';
  export let task: string = 'Watching Files';
  export let status: 'active' | 'idle' | 'working' = 'active';
  export let icon: string = '🤖';
</script>

<div class="minion-card status-{status}">
  <div class="minion-icon">{icon}</div>
  <div class="minion-info">
    <span class="minion-name">{name}</span>
    <span class="minion-task">{task}</span>
  </div>
  <div class="minion-status">
    <span class="status-dot"></span>
  </div>
</div>

<style>
  .minion-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }

  .minion-card:hover {
    border-color: rgba(139, 92, 246, 0.5);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
    transform: translateY(-1px);
  }

  .minion-icon {
    font-size: 1.25rem;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(139, 92, 246, 0.1);
    border-radius: 0.375rem;
  }

  .minion-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .minion-name {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .minion-task {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .minion-status {
    display: flex;
    align-items: center;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .status-active .status-dot {
    background: #22c55e;
    box-shadow: 0 0 8px #22c55e;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .status-working .status-dot {
    background: #f59e0b;
    box-shadow: 0 0 8px #f59e0b;
    animation: pulse-fast 0.5s ease-in-out infinite;
  }

  .status-idle .status-dot {
    background: rgba(255, 255, 255, 0.3);
    box-shadow: none;
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.1); }
  }

  @keyframes pulse-fast {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
