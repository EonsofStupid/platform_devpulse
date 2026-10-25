<script>
    import GlassPanel from "$lib/design/block_library/Panel.svelte";
</script>

<div class="chat-window">
    <GlassPanel variant="glass" padding="none" class="chat-panel">
        <div class="header">
            <span class="title">MAESTRO</span>
            <div class="status">ONLINE</div>
        </div>

        <div class="messages">
            <!-- Messages will go here -->
            <div class="msg ai">Hello. I am listening.</div>
        </div>

        <div class="input-area">
            <div class="dp-surface chat-input-surface" data-surface="glass" data-variant="smoke">
                <input type="text" placeholder="Send a signal..." />
            </div>
        </div>
    </GlassPanel>
</div>

<style>
    :global(body) {
        background: transparent;
    }

    .chat-window {
        width: 100vw;
        height: 100vh;
    }

    :global(.chat-panel) {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        border-radius: var(--radius-lg);
    }

    .header {
        height: 48px;
        border-bottom: var(--border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--space-4);
        font-weight: bold;
        letter-spacing: 1px;
        color: var(--text-white);
    }

    .status {
        font-size: var(--text-xs);
        color: var(--signal-teal);
    }

    .messages {
        flex: 1;
        padding: var(--space-4);
        color: var(--text-secondary);
    }

    .msg.ai {
        color: var(--signal-teal);
    }

    .input-area {
        padding: var(--space-4);
        border-top: var(--border-subtle);
    }

    .chat-input-surface {
        height: 40px;
        border-radius: var(--radius-md);
    }

    input {
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        color: var(--text-white);
        padding: 0 var(--space-4);
        outline: none;
    }

    input::placeholder {
        color: var(--text-muted);
    }
</style>
