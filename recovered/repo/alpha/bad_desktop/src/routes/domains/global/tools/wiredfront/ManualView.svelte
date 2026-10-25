<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { CaptureRegion } from "./types";

    const dispatch = createEventDispatcher();

    export let isCapturing = false;

    let isSelecting = false;
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    function startSelection() {
        isSelecting = true;
    }

    function handleMouseDown(e: MouseEvent) {
        if (!isSelecting) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        endX = startX;
        endY = startY;
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isSelecting || startX === 0) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        endX = e.clientX - rect.left;
        endY = e.clientY - rect.top;
    }

    function handleMouseUp() {
        if (!isSelecting || startX === 0) return;

        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);

        if (width > 10 && height > 10) {
            const region: CaptureRegion = {
                x: Math.round(x),
                y: Math.round(y),
                width: Math.round(width),
                height: Math.round(height),
            };

            dispatch("capture", region);
        }

        // Reset
        isSelecting = false;
        startX = 0;
        startY = 0;
        endX = 0;
        endY = 0;
    }

    $: selectionBox = {
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
    };

    $: dimensionsText = `${selectionBox.width} × ${selectionBox.height}`;
</script>

<div class="manual-container">
    <div class="instruction-card glass">
        <h2>
            <span class="icon">✂️</span>
            Manual Region Selection
        </h2>
        <p class="description">
            Click "Start Selection" then drag to select the area you want to
            capture
        </p>

        <button
            class="start-button"
            on:click={startSelection}
            disabled={isSelecting || isCapturing}
        >
            {#if isSelecting}
                🎯 Selecting... (drag to select)
            {:else if isCapturing}
                ⏳ Capturing...
            {:else}
                🎯 Start Selection
            {/if}
        </button>
    </div>

    {#if isSelecting}
        <div
            class="selection-overlay"
            role="button"
            tabindex="0"
            on:mousedown={handleMouseDown}
            on:mousemove={handleMouseMove}
            on:mouseup={handleMouseUp}
            on:keydown={(e) => e.key === "Escape" && (isSelecting = false)}
        >
            <div class="crosshair" />

            {#if startX > 0}
                <div
                    class="selection-box"
                    style="left: {selectionBox.x}px; top: {selectionBox.y}px; width: {selectionBox.width}px; height: {selectionBox.height}px;"
                >
                    <div class="selection-border" />
                    <div class="selection-handles">
                        <div class="handle top-left" />
                        <div class="handle top-right" />
                        <div class="handle bottom-left" />
                        <div class="handle bottom-right" />
                    </div>
                    {#if selectionBox.width > 50 && selectionBox.height > 30}
                        <div class="dimensions-tooltip">{dimensionsText}</div>
                    {/if}
                </div>
            {/if}

            <div class="escape-hint">Press ESC to cancel</div>
        </div>
    {/if}
</div>

<style>
    .manual-container {
        position: relative;
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

    .instruction-card {
        padding: 3rem 2rem;
        text-align: center;
        max-width: 600px;
        margin: 2rem auto;
    }

    .instruction-card h2 {
        margin: 0 0 1rem 0;
        font-size: 2rem;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }

    .icon {
        font-size: 2.5rem;
    }

    .description {
        margin: 0 0 2rem 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 1.1rem;
        line-height: 1.6;
    }

    .start-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border: none;
        padding: 1.25rem 3rem;
        border-radius: 16px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 24px rgba(102, 126, 234, 0.4);
    }

    .start-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 32px rgba(102, 126, 234, 0.6);
    }

    .start-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    /* Selection Overlay */
    .selection-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        cursor: crosshair;
        z-index: 9999;
    }

    .crosshair {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .selection-box {
        position: absolute;
        border: 2px solid #667eea;
        background: rgba(102, 126, 234, 0.1);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    }

    .selection-border {
        position: absolute;
        inset: -2px;
        border: 2px dashed #764ba2;
        animation: dash 20s linear infinite;
    }

    @keyframes dash {
        to {
            stroke-dashoffset: -1000;
        }
    }

    .selection-handles {
        position: absolute;
        inset: -6px;
    }

    .handle {
        position: absolute;
        width: 12px;
        height: 12px;
        background: #667eea;
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .handle.top-left {
        top: 0;
        left: 0;
    }
    .handle.top-right {
        top: 0;
        right: 0;
    }
    .handle.bottom-left {
        bottom: 0;
        left: 0;
    }
    .handle.bottom-right {
        bottom: 0;
        right: 0;
    }

    .dimensions-tooltip {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-family: "JetBrains Mono", "Consolas", monospace;
        font-size: 1rem;
        font-weight: 600;
        pointer-events: none;
        white-space: nowrap;
    }

    .escape-hint {
        position: fixed;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        padding: 1rem 2rem;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 500;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
        z-index: 10000;
    }
</style>
