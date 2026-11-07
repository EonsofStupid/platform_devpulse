<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { onMount, createEventDispatcher } from "svelte";
    import type { ScreenInfo } from "./types";

    const dispatch = createEventDispatcher();

    export let isCapturing = false;

    let screens: ScreenInfo[] = [];
    let loading = true;

    onMount(async () => {
        try {
            screens = await invoke<ScreenInfo[]>("list_screens");
        } catch (error) {
            console.error("Failed to list screens:", error);
        } finally {
            loading = false;
        }
    });

    function handleScreenClick(screenId: number) {
        if (!isCapturing) {
            dispatch("capture", screenId);
        }
    }
</script>

<div class="monitors-container">
    {#if loading}
        <div class="loading-state glass">
            <div class="spinner" />
            <p>Detecting monitors...</p>
        </div>
    {:else if screens.length === 0}
        <div class="empty-state glass">
            <span class="empty-icon">🖥️</span>
            <p>No monitors detected</p>
        </div>
    {:else}
        <div class="monitors-grid">
            {#each screens as screen}
                <button
                    class="monitor-card glass"
                    class:capturing={isCapturing}
                    class:primary={screen.is_primary}
                    on:click={() => handleScreenClick(screen.id)}
                    disabled={isCapturing}
                >
                    <div class="monitor-preview">
                        <div class="monitor-icon">
                            {#if screen.is_primary}
                                ⭐
                            {/if}
                            🖥️
                        </div>
                        <div class="monitor-resolution">
                            {screen.width} × {screen.height}
                        </div>
                    </div>

                    <div class="monitor-info">
                        <h3>{screen.name}</h3>
                        <div class="monitor-meta">
                            <span class="meta-item">
                                {#if screen.is_primary}
                                    <span class="badge primary-badge"
                                        >Primary</span
                                    >
                                {/if}
                            </span>
                            <span class="meta-item"
                                >Scale: {screen.scale_factor.toFixed(2)}x</span
                            >
                        </div>
                    </div>

                    <div class="capture-overlay">
                        <span class="capture-icon">📸</span>
                        <span class="capture-text">Click to Capture</span>
                    </div>
                </button>
            {/each}
        </div>

        <div class="hint-box glass">
            <span class="hint-icon">💡</span>
            <p>
                Click on any monitor to capture it, or use the floating button
                to capture all screens
            </p>
        </div>
    {/if}
</div>

<style>
    .monitors-container {
        padding: 1rem;
    }

    .glass {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    }

    /* Loading State */
    .loading-state,
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        padding: 4rem 2rem;
        color: rgba(255, 255, 255, 0.7);
    }

    .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(102, 126, 234, 0.2);
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .empty-icon {
        font-size: 4rem;
        opacity: 0.5;
    }

    /* Monitors Grid */
    .monitors-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
    }

    .monitor-card {
        position: relative;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 2rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        text-align: left;
    }

    .monitor-card:hover:not(:disabled) {
        transform: translateY(-4px);
        border-color: rgba(102, 126, 234, 0.5);
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    }

    .monitor-card:hover:not(:disabled) .capture-overlay {
        opacity: 1;
    }

    .monitor-card:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .monitor-card.primary {
        border-color: rgba(255, 215, 0, 0.3);
    }

    .monitor-card.primary:hover:not(:disabled) {
        border-color: rgba(255, 215, 0, 0.6);
        box-shadow: 0 8px 32px rgba(255, 215, 0, 0.2);
    }

    .monitor-preview {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
    }

    .monitor-icon {
        font-size: 3rem;
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .monitor-resolution {
        font-family: "JetBrains Mono", "Consolas", monospace;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.6);
        background: rgba(255, 255, 255, 0.05);
        padding: 0.5rem 1rem;
        border-radius: 8px;
    }

    .monitor-info h3 {
        margin: 0 0 0.75rem 0;
        color: #fff;
        font-size: 1.25rem;
        font-weight: 600;
    }

    .monitor-meta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .meta-item {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .badge {
        background: linear-gradient(
            135deg,
            rgba(255, 215, 0, 0.3),
            rgba(255, 165, 0, 0.3)
        );
        color: #ffd700;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Capture Overlay */
    .capture-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            135deg,
            rgba(102, 126, 234, 0.9),
            rgba(118, 75, 162, 0.9)
        );
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .capture-icon {
        font-size: 3rem;
        animation: float 2s ease-in-out infinite;
    }

    @keyframes float {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-8px);
        }
    }

    .capture-text {
        color: #fff;
        font-size: 1.1rem;
        font-weight: 600;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    /* Hint Box */
    .hint-box {
        margin-top: 2rem;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .hint-icon {
        font-size: 1.5rem;
    }

    .hint-box p {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.95rem;
        line-height: 1.5;
    }

    @media (max-width: 768px) {
        .monitors-grid {
            grid-template-columns: 1fr;
        }

        .monitor-card {
            padding: 1.5rem;
        }
    }
</style>
