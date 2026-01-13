<script lang="ts">
  export let status: 'active' | 'loading' | 'error' | 'offline' = 'active';
  export let label: string = 'Maestro Status';
</script>

<div class="status-indicator status-{status}">
  <span class="dot"></span>
  <span class="label">{label}</span>
  <span class="value">{status.toUpperCase()}</span>
</div>

<style>
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .status-active .dot {
    background: #22c55e;
    box-shadow: 0 0 12px #22c55e, 0 0 24px #22c55e;
  }

  .status-loading .dot {
    background: #f59e0b;
    box-shadow: 0 0 12px #f59e0b;
  }

  .status-error .dot {
    background: #ef4444;
    box-shadow: 0 0 12px #ef4444;
  }

  .status-offline .dot {
    background: rgba(255, 255, 255, 0.3);
    box-shadow: none;
    animation: none;
  }

  .label {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .value {
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .status-active .value { color: #22c55e; }
  .status-loading .value { color: #f59e0b; }
  .status-error .value { color: #ef4444; }
  .status-offline .value { color: rgba(255, 255, 255, 0.5); }

  @keyframes pulse-glow {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }
</style>
