<script>
    import Surface from "$lib/design/primitives/Surface.svelte";
</script>

<Surface variant="deep" class="chat-window">
    <div class="header">
        <span class="title">MAESTRO</span>
        <div class="status">ONLINE</div>
    </div>

    <div class="messages">
        <!-- Messages will go here -->
        <div class="msg ai">Hello. I am listening.</div>
    </div>

    <div class="input-area">
        <Surface variant="metallic" class="chat-input-surface">
            <input type="text" placeholder="Send a signal..." />
        </Surface>
    </div>
</Surface>

<style>
    :global(body) {
        background: transparent;
    }

    /* Outer Container matches Window Size */
    :global(.chat-window) {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        border-radius: 12px; /* Smooth corners for the floating window */
    }

    .header {
        height: 48px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1rem;
        font-weight: bold;
        letter-spacing: 1px;
    }

    .messages {
        flex: 1;
        padding: 1rem;
        color: rgba(255, 255, 255, 0.8);
    }

    .input-area {
        padding: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    :global(.chat-input-surface) {
        height: 40px;
    }

    input {
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        color: white;
        padding: 0 1rem;
        outline: none;
    }
</style>
