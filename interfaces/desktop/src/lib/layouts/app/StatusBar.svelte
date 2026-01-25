<!--
  @file src/lib/layouts/app/StatusBar.svelte
  @name StatusBar.svelte
  @module @devpulse/layouts/app/StatusBar
  @layer lib

  @description
  [TODO: Describe this component's purpose]

  @props
  - [TODO: propName]: [type] - [description]

  @dependencies
  - [TODO: List imports]

  @consumers
  - [TODO: List who uses this component]

  @vpb-editable [TODO: List editable props]
  @since 1.0.0
-->
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
    /* =============================================
       STATUSBAR - HUD SYSTEM MONITOR
       ============================================= */
    .statusbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        padding: 0 16px;
        box-sizing: border-box;
    }

    .statusbar-left,
    .statusbar-center,
    .statusbar-right {
        display: flex;
        align-items: center;
        gap: 10px;
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

    /* =============================================
       STATUS INDICATOR DOT - NEON GLOW
       ============================================= */
    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 9999px;
        background: hsl(0 0% 60%);
        transition: all 0.3s ease;
    }

    /* Online - CYAN NEON GLOW (matches theme) */
    .status-indicator.online {
        background: hsl(191 100% 60%);
        box-shadow:
            0 0 8px hsl(191 100% 60% / 0.9),
            0 0 16px hsl(191 100% 60% / 0.5),
            0 0 24px hsl(191 100% 60% / 0.3);
        animation: status-pulse 2s ease-in-out infinite;
    }

    /* Offline - RED with subtle glow */
    .status-indicator.offline {
        background: hsl(0 100% 60%);
        box-shadow:
            0 0 6px hsl(0 100% 60% / 0.6);
    }

    /* Warning - AMBER glow */
    .status-indicator.warning {
        background: hsl(43 100% 55%);
        box-shadow:
            0 0 8px hsl(43 100% 55% / 0.8),
            0 0 16px hsl(43 100% 55% / 0.4);
        animation: status-pulse-amber 1.5s ease-in-out infinite;
    }

    /* Processing - CYAN with faster pulse */
    .status-indicator.processing {
        background: hsl(191 100% 60%);
        box-shadow:
            0 0 8px hsl(191 100% 60% / 0.9),
            0 0 16px hsl(191 100% 60% / 0.5);
        animation: status-pulse 0.8s ease-in-out infinite;
    }

    @keyframes status-pulse {
        0%, 100% {
            box-shadow:
                0 0 8px hsl(191 100% 60% / 0.9),
                0 0 16px hsl(191 100% 60% / 0.5),
                0 0 24px hsl(191 100% 60% / 0.3);
        }
        50% {
            box-shadow:
                0 0 12px hsl(191 100% 60% / 1),
                0 0 24px hsl(191 100% 60% / 0.7),
                0 0 36px hsl(191 100% 60% / 0.4);
        }
    }

    @keyframes status-pulse-amber {
        0%, 100% {
            box-shadow:
                0 0 8px hsl(43 100% 55% / 0.8),
                0 0 16px hsl(43 100% 55% / 0.4);
        }
        50% {
            box-shadow:
                0 0 12px hsl(43 100% 55% / 1),
                0 0 24px hsl(43 100% 55% / 0.6);
        }
    }

    /* =============================================
       STATUS TEXT - HUD MONOSPACE
       ============================================= */
    .status-text {
        font-size: 0.7rem;
        font-family: "JetBrains Mono", "Fira Code", monospace;
        color: hsl(0 0% 65%);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        transition: color 0.2s ease;
    }

    .status-text.muted {
        color: hsl(0 0% 45%);
    }

    .status-text.bright {
        color: hsl(191 100% 75%);
    }

    /* Hover brightens text + intensifies glow */
    .statusbar-left:hover .status-text,
    .statusbar-center:hover .status-text,
    .statusbar-right:hover .status-text {
        color: hsl(0 0% 90%);
    }

    .statusbar-left:hover .status-indicator.online {
        box-shadow:
            0 0 12px hsl(191 100% 60% / 1),
            0 0 24px hsl(191 100% 60% / 0.7),
            0 0 36px hsl(191 100% 60% / 0.4);
    }

    /* =============================================
       STATUS GROUP - VISUAL SEPARATION
       ============================================= */
    .status-group {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background: hsl(222 60% 8% / 0.5);
        border-radius: 4px;
        border: 1px solid hsl(191 100% 60% / 0.1);
        transition:
            background 0.2s ease,
            border-color 0.2s ease;
    }

    .status-group:hover {
        background: hsl(222 55% 10% / 0.7);
        border-color: hsl(191 100% 60% / 0.25);
    }

    /* =============================================
       DIVIDER - SUBTLE SEPARATOR
       ============================================= */
    .status-divider {
        width: 1px;
        height: 16px;
        background: linear-gradient(
            180deg,
            transparent 0%,
            hsl(191 100% 60% / 0.3) 50%,
            transparent 100%
        );
    }
</style>
