<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { onMount } from "svelte";
    import MonitorsView from "./MonitorsView.svelte";
    import ManualView from "./ManualView.svelte";
    import PreviewModal from "./PreviewModal.svelte";
    import type { CaptureResult } from "./types";

    type CaptureMode = "monitors" | "manual";

    let activeMode: CaptureMode = "monitors";
    let captureResult: CaptureResult | null = null;
    let showPreview = false;
    let isCapturing = false;

    async function handleMonitorCapture(screenId: number) {
        isCapturing = true;
        try {
            if (screenId === -1) {
                captureResult = await invoke<CaptureResult>("capture_screen");
            } else {
                captureResult = await invoke<CaptureResult>(
                    "capture_screen_by_id",
                    {
                        screenId,
                    },
                );
            }
            showPreview = true;
        } catch (error) {
            console.error("Failed to capture screen:", error);
            alert(`Capture failed: ${error}`);
        } finally {
            isCapturing = false;
        }
    }

    async function handleRegionCapture(region: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) {
        isCapturing = true;
        try {
            captureResult = await invoke<CaptureResult>("capture_region", {
                region,
            });
            showPreview = true;
        } catch (error) {
            console.error("Failed to capture region:", error);
            alert(`Capture failed: ${error}`);
        } finally {
            isCapturing = false;
        }
    }

    function handlePreviewClose() {
        showPreview = false;
        captureResult = null;
    }
</script>

<div class="wiredfront-container">
    <!-- Header with Glassmorphic Effect -->
    <div class="glass-header">
        <div class="header-content">
            <h1>
                <span class="icon">📷</span>
                WiredFront Capture
            </h1>
            <p class="subtitle">Capture your screen with style</p>
        </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-nav glass">
        <button
            class="tab-button"
            class:active={activeMode === "monitors"}
            on:click={() => (activeMode = "monitors")}
        >
            <span class="tab-icon">🖥️</span>
            <span class="tab-label">Monitors</span>
        </button>

        <button
            class="tab-button"
            class:active={activeMode === "manual"}
            on:click={() => (activeMode = "manual")}
        >
            <span class="tab-icon">✂️</span>
            <span class="tab-label">Manual</span>
        </button>

        <div
            class="tab-indicator"
            style="--active-index: {activeMode === 'monitors' ? 0 : 1}"
        />
    </div>

    <!-- Content Area -->
    <div class="content-area">
        {#if activeMode === "monitors"}
            <MonitorsView
                on:capture={(e) => handleMonitorCapture(e.detail)}
                {isCapturing}
            />
        {:else}
            <ManualView
                on:capture={(e) => handleRegionCapture(e.detail)}
                {isCapturing}
            />
        {/if}
    </div>

    <!-- Floating Capture Button -->
    {#if activeMode === "monitors"}
        <button
            class="fab-capture"
            on:click={() => handleMonitorCapture(-1)}
            disabled={isCapturing}
        >
            <span class="fab-icon">📸</span>
            <span class="fab-pulse" />
        </button>
    {/if}
</div>

{#if showPreview && captureResult}
    <PreviewModal result={captureResult} on:close={handlePreviewClose} />
{/if}

<style>
    .wiredfront-container {
        position: relative;
        width: 100%;
        min-height: 100vh;
        background: linear-gradient(
            135deg,
            #0a0e27 0%,
            #1a1f3a 50%,
            #0f1729 100%
        );
        padding: 2rem;
        overflow-x: hidden;
    }

    /* Glassmorphic Header */
    .glass-header {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 2rem 3rem;
        margin-bottom: 2rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .header-content h1 {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .icon {
        font-size: 3rem;
        filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.4));
    }

    .subtitle {
        margin: 0.5rem 0 0 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 1.1rem;
        font-weight: 300;
        letter-spacing: 0.5px;
    }

    /* Tab Navigation */
    .tab-nav {
        position: relative;
        display: flex;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 0.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    }

    .tab-button {
        flex: 1;
        position: relative;
        background: transparent;
        border: none;
        padding: 1rem 2rem;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        font-size: 1rem;
        font-weight: 500;
        z-index: 2;
    }

    .tab-button:hover {
        color: rgba(255, 255, 255, 0.8);
        transform: translateY(-2px);
    }

    .tab-button.active {
        color: #fff;
    }

    .tab-icon {
        font-size: 1.5rem;
    }

    .tab-indicator {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        width: calc(50% - 0.5rem);
        height: calc(100% - 1rem);
        background: linear-gradient(
            135deg,
            rgba(102, 126, 234, 0.3),
            rgba(118, 75, 162, 0.3)
        );
        border-radius: 12px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateX(calc(var(--active-index) * 100%));
        z-index: 1;
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
    }

    /* Content Area */
    .content-area {
        min-height: 500px;
    }

    /* Floating Action Button */
    .fab-capture {
        position: fixed;
        bottom: 3rem;
        right: 3rem;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 100;
        position: relative;
    }

    .fab-capture:hover:not(:disabled) {
        transform: translateY(-4px) scale(1.05);
        box-shadow: 0 12px 40px rgba(102, 126, 234, 0.6);
    }

    .fab-capture:active:not(:disabled) {
        transform: translateY(-2px) scale(1.02);
    }

    .fab-capture:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .fab-icon {
        font-size: 2rem;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        z-index: 2;
        position: relative;
    }

    .fab-pulse {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        opacity: 0;
    }

    @keyframes pulse {
        0%,
        100% {
            transform: scale(1);
            opacity: 0;
        }
        50% {
            transform: scale(1.3);
            opacity: 0.3;
        }
    }

    @media (max-width: 768px) {
        .wiredfront-container {
            padding: 1rem;
        }

        .glass-header {
            padding: 1.5rem;
        }

        .header-content h1 {
            font-size: 2rem;
        }

        .tab-button {
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.75rem;
        }

        .tab-label {
            font-size: 0.9rem;
        }

        .fab-capture {
            bottom: 2rem;
            right: 2rem;
            width: 64px;
            height: 64px;
        }
    }
</style>
