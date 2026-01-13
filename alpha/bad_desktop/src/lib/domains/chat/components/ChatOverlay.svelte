<script lang="ts">
  import { onMount } from 'svelte';
  import ChatView from './ChatView.svelte';
  import { chatStore } from '../stores';
  import { ruminationState } from '$lib/stores';

  // Chat overlay can be: closed, minimized (fab), or open (panel)
  let mode = $derived(chatStore.mode);
  let isOpen = $derived(mode === 'open');

  // Rumination indicator - always on, shows processing state
  let isRuminating = $derived(ruminationState.isProcessing);
  let currentLayer = $derived(ruminationState.layerLabel);

  function toggleChat() {
    if (mode === 'closed' || mode === 'minimized') {
      chatStore.open();
    } else {
      chatStore.minimize();
    }
  }

  function closeChat() {
    chatStore.close();
  }

  // Keyboard shortcut: Cmd/Ctrl + G to toggle Maestro
  function handleKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'g') {
      event.preventDefault();
      toggleChat();
    }
    if (event.key === 'Escape' && isOpen) {
      chatStore.minimize();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

<!-- Maestro FAB (Floating Action Button) - Always visible when chat is not open -->
{#if !isOpen}
  <button
    class="maestro-fab glass-intense"
    class:has-notification={chatStore.hasUnread}
    class:is-ruminating={isRuminating}
    onclick={toggleChat}
    aria-label="Open Maestro"
  >
    <div class="maestro-avatar" class:ruminating={isRuminating}>
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="16" cy="16" r="6" fill="currentColor"/>
        <path d="M16 2v6M16 24v6M2 16h6M24 16h6" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>
    <!-- Rumination ring indicator -->
    {#if isRuminating}
      <div class="rumination-ring"></div>
    {/if}
    {#if chatStore.hasUnread}
      <span class="notification-dot"></span>
    {/if}
  </button>
{/if}

<!-- Maestro Panel Overlay -->
{#if isOpen}
  <div
    class="maestro-overlay"
    role="button"
    tabindex="-1"
    onclick={(e) => e.target === e.currentTarget && chatStore.minimize()}
    onkeydown={(e) => e.key === 'Escape' && chatStore.minimize()}
  >
    <aside class="maestro-panel glass-intense animate-slide-in">
      <header class="maestro-header">
        <div class="maestro-title">
          <div class="maestro-avatar-small" class:ruminating={isRuminating}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2" fill="none"/>
              <circle cx="16" cy="16" r="6" fill="currentColor"/>
              <path d="M16 2v6M16 24v6M2 16h6M24 16h6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <span class="text-bevel">Maestro</span>
          {#if isRuminating}
            <span class="status-badge rumination-badge">{currentLayer}</span>
          {:else}
            <span class="status-badge badge-success">Ready</span>
          {/if}
        </div>
        <div class="maestro-actions">
          <button class="action-btn btn-ghost" onclick={() => chatStore.minimize()} aria-label="Minimize">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button class="action-btn btn-ghost" onclick={closeChat} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      <div class="maestro-content">
        <ChatView />
      </div>

      <footer class="maestro-footer">
        <span class="shortcut-hint text-muted">Ctrl+G to toggle</span>
      </footer>
    </aside>
  </div>
{/if}

<style>
  /* === MAESTRO FAB === */
  .maestro-fab {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1000;
    transition: all var(--transition-normal);
    box-shadow:
      0 4px 20px rgba(127, 47, 168, 0.4),
      0 0 30px rgba(127, 47, 168, 0.2);
  }

  .maestro-fab:hover {
    transform: scale(1.1);
    box-shadow:
      0 6px 30px rgba(127, 47, 168, 0.5),
      0 0 40px rgba(127, 47, 168, 0.3);
  }

  .maestro-fab:active {
    transform: scale(0.95);
  }

  .maestro-fab .maestro-avatar {
    color: var(--accent);
    display: flex;
    filter: drop-shadow(0 0 8px rgba(127, 47, 168, 0.6));
  }

  .maestro-fab.has-notification {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .maestro-fab.is-ruminating {
    animation: rumination-glow 1.5s ease-in-out infinite;
  }

  .maestro-avatar.ruminating {
    animation: rumination-spin 3s linear infinite;
  }

  /* Rumination ring - circular indicator around FAB */
  .rumination-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: #4F46E5;
    border-right-color: rgba(79, 70, 229, 0.5);
    animation: rumination-ring-spin 1s linear infinite;
  }

  .notification-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 12px;
    height: 12px;
    background: var(--chart-2);
    border-radius: 50%;
    border: 2px solid var(--background);
    box-shadow: 0 0 8px rgba(0, 184, 122, 0.6);
  }

  /* === MAESTRO OVERLAY === */
  .maestro-overlay {
    position: fixed;
    inset: 0;
    z-index: 1001;
    display: flex;
    justify-content: flex-end;
    background: rgba(36, 3, 54, 0.3);
    backdrop-filter: blur(4px);
  }

  /* === MAESTRO PANEL === */
  .maestro-panel {
    width: 420px;
    max-width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--glass-border);
    box-shadow:
      -10px 0 40px rgba(0, 0, 0, 0.4),
      0 0 60px rgba(127, 47, 168, 0.15);
  }

  .maestro-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(130, 111, 214, 0.2);
  }

  .maestro-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .maestro-avatar-small {
    color: var(--accent);
    display: flex;
    filter: drop-shadow(0 0 6px rgba(127, 47, 168, 0.5));
  }

  .maestro-title span:not(.status-badge) {
    font-size: 1.125rem;
    font-weight: 600;
  }

  .status-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.5rem;
  }

  .rumination-badge {
    background: linear-gradient(135deg, #4F46E5 0%, rgba(79, 70, 229, 0.7) 100%);
    color: white;
    border: 1px solid rgba(79, 70, 229, 0.5);
    animation: rumination-badge-pulse 1.5s ease-in-out infinite;
  }

  .maestro-avatar-small.ruminating {
    animation: rumination-spin 3s linear infinite;
  }

  .maestro-actions {
    display: flex;
    gap: 0.25rem;
  }

  .action-btn {
    padding: 0.5rem;
    color: var(--foreground-muted);
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
  }

  .action-btn:hover {
    color: var(--foreground);
    background: rgba(130, 111, 214, 0.1);
  }

  .maestro-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .maestro-footer {
    padding: 0.5rem 1rem;
    border-top: 1px solid rgba(130, 111, 214, 0.2);
    text-align: center;
  }

  .shortcut-hint {
    font-size: 0.6875rem;
    opacity: 0.6;
  }

  /* === ANIMATIONS === */
  @keyframes pulse-glow {
    0%, 100% {
      box-shadow:
        0 4px 20px rgba(127, 47, 168, 0.4),
        0 0 30px rgba(127, 47, 168, 0.2);
    }
    50% {
      box-shadow:
        0 4px 30px rgba(127, 47, 168, 0.6),
        0 0 50px rgba(127, 47, 168, 0.4);
    }
  }

  .animate-slide-in {
    animation: slide-in-right 0.3s ease-out;
  }

  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Rumination animations */
  @keyframes rumination-glow {
    0%, 100% {
      box-shadow:
        0 4px 20px rgba(79, 70, 229, 0.4),
        0 0 30px rgba(79, 70, 229, 0.2);
    }
    50% {
      box-shadow:
        0 4px 35px rgba(79, 70, 229, 0.6),
        0 0 50px rgba(79, 70, 229, 0.4);
    }
  }

  @keyframes rumination-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes rumination-ring-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes rumination-badge-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* === RESPONSIVE === */
  @media (max-width: 480px) {
    .maestro-panel {
      width: 100vw;
    }
  }
</style>
