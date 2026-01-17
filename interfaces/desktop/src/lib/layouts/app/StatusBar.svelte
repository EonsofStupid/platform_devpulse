<!--
    STATUSBAR.SVELTE - Persistent Footer (100% width)
    ==================================================
    - System status indicators
    - Glass effect with subtle bevel
    - 100% width, no padding from frame edges
-->
<script lang="ts">
    // TODO: Connect to actual system state
    const status = {
        connection: "online",
        uptime: "12d 4h",
        version: "0.1.0",
    };
</script>

<div class="statusbar">
    <div class="statusbar-left">
        <span
            class="status-indicator"
            class:online={status.connection === "online"}
            class:offline={status.connection === "offline"}
        ></span>
        <span class="status-text">{status.connection}</span>
    </div>

    <div class="statusbar-center">
        <span class="status-text muted">Uptime: {status.uptime}</span>
    </div>

    <div class="statusbar-right">
        <span class="status-text muted">v{status.version}</span>
    </div>
</div>

<style>
    .statusbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        padding: 0 var(--space-4);
        box-sizing: border-box;
    }

    .statusbar-left,
    .statusbar-center,
    .statusbar-right {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .statusbar-left {
        flex: 0 0 auto;
    }

    .statusbar-center {
        flex: 1;
        justify-content: center;
    }

    .statusbar-right {
        flex: 0 0 auto;
    }

    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: var(--radius-full);
        background: var(--text-muted);
    }

    .status-indicator.online {
        background: var(--signal-success);
        box-shadow: 0 0 8px var(--signal-success);
    }

    .status-indicator.offline {
        background: var(--signal-error);
    }

    .status-text {
        font-size: var(--text-xs);
        font-family: var(--font-mono);
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .status-text.muted {
        color: var(--text-muted);
    }
</style>
