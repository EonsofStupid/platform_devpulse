<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { createEventDispatcher } from "svelte";
    import type { CaptureResult, SaveOptions } from "./types";

    const dispatch = createEventDispatcher();

    export let result: CaptureResult;

    let saving = false;
    let saved = false;
    let saveScope: "global" | "project" = "global";

    async function handleCopy() {
        try {
            await invoke("copy_capture_to_clipboard", {
                dataBase64: result.data_base64,
            });
            showToast("✅ Copied to clipboard!");
        } catch (error) {
            console.error("Failed to copy:", error);
            showToast("❌ Copy failed");
        }
    }

    async function handleSave() {
        saving = true;
        try {
            const options: SaveOptions = {
                scope: saveScope,
            };

            const path = await invoke<string>("save_capture", {
                dataBase64: result.data_base64,
                options,
            });

            saved = true;
            result.file_path = path;
            showToast("✅ Saved successfully!");
        } catch (error) {
            console.error("Failed to save:", error);
            showToast("❌ Save failed");
        } finally {
            saving = false;
        }
    }

    async function handleShare() {
        // TODO: Implement channel sharing
        showToast("🔜 Channel sharing coming soon!");
    }

    async function handleToGus() {
        // TODO: Implement Gus integration
        showToast("🔜 Gus integration coming soon!");
    }

    function handleClose() {
        dispatch("close");
    }

    function handleDiscard() {
        dispatch("close");
    }

    function showToast(message: string) {
        // Simple toast notification - could be replaced with a proper toast system
        const toast = document.createElement("div");
        toast.textContent = message;
        toast.style.cssText = `
			position: fixed;
			top: 2rem;
			right: 2rem;
			background: rgba(0, 0, 0, 0.9);
			color: white;
			padding: 1rem 2rem;
			border-radius: 12px;
			font-weight: 600;
			z-index: 99999;
			animation: slideIn 0.3s ease;
		`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    $: imageUrl = `data:image/png;base64,${result.data_base64}`;
    $: formattedDate = new Date(result.timestamp).toLocaleString();
</script>

<div class="modal-backdrop" on:click={handleClose} role="button" tabindex="-1">
    <div
        class="modal-container glass"
        on:click|stopPropagation
        role="dialog"
        aria-modal="true"
        tabindex="-1"
    >
        <!-- Header -->
        <div class="modal-header">
            <div class="header-left">
                <h2>
                    <span class="icon">📸</span>
                    Capture Preview
                </h2>
                <p class="meta">
                    {result.width} × {result.height} • {formattedDate}
                </p>
            </div>
            <button
                class="close-button"
                on:click={handleClose}
                aria-label="Close"
            >
                <span>✕</span>
            </button>
        </div>

        <!-- Image Preview -->
        <div class="image-container">
            <img
                src={imageUrl}
                alt="Captured screenshot"
                class="preview-image"
            />
        </div>

        <!-- Actions -->
        <div class="actions-container">
            <div class="save-options">
                <label class="scope-selector">
                    <input type="radio" bind:group={saveScope} value="global" />
                    <span>Global</span>
                </label>
                <label class="scope-selector">
                    <input
                        type="radio"
                        bind:group={saveScope}
                        value="project"
                    />
                    <span>Project</span>
                </label>
            </div>

            <div class="action-buttons">
                <button class="action-btn share-btn" on:click={handleShare}>
                    <span class="btn-icon">📤</span>
                    <span>Share</span>
                </button>

                <button class="action-btn gus-btn" on:click={handleToGus}>
                    <span class="btn-icon">🤖</span>
                    <span>To Gus</span>
                </button>

                <button class="action-btn copy-btn" on:click={handleCopy}>
                    <span class="btn-icon">📋</span>
                    <span>Copy</span>
                </button>

                <button
                    class="action-btn save-btn"
                    on:click={handleSave}
                    disabled={saving || saved}
                >
                    <span class="btn-icon"
                        >{saved ? "✅" : saving ? "⏳" : "💾"}</span
                    >
                    <span
                        >{saved ? "Saved" : saving ? "Saving..." : "Save"}</span
                    >
                </button>

                <button class="action-btn discard-btn" on:click={handleDiscard}>
                    <span class="btn-icon">🗑️</span>
                    <span>Discard</span>
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9998;
        padding: 2rem;
        animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .modal-container {
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    /* Header */
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-left h2 {
        margin: 0;
        color: #fff;
        font-size: 1.75rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .icon {
        font-size: 2rem;
    }

    .meta {
        margin: 0.5rem 0 0 0;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
        font-family: "JetBrains Mono", "Consolas", monospace;
    }

    .close-button {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        font-size: 1.5rem;
    }

    .close-button:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        transform: rotate(90deg);
    }

    /* Image Container */
    .image-container {
        flex: 1;
        overflow: auto;
        padding: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
    }

    .preview-image {
        max-width: 100%;
        max-height: 100%;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }

    /* Actions */
    .actions-container {
        padding: 1.5rem 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
    }

    .save-options {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        justify-content: center;
    }

    .scope-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid transparent;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: rgba(255, 255, 255, 0.6);
    }

    .scope-selector:has(input:checked) {
        background: rgba(102, 126, 234, 0.2);
        border-color: #667eea;
        color: #fff;
    }

    .scope-selector input {
        margin: 0;
    }

    .action-buttons {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;
    }

    .action-btn {
        flex: 1;
        min-width: 120px;
        padding: 1rem 1.5rem;
        border: none;
        border-radius: 14px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }

    .action-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-icon {
        font-size: 1.25rem;
    }

    .share-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
    }

    .share-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4);
    }

    .gus-btn {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: #fff;
    }

    .gus-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(240, 147, 251, 0.4);
    }

    .copy-btn {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }

    .copy-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
    }

    .save-btn {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: #fff;
    }

    .save-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(56, 239, 125, 0.4);
    }

    .discard-btn {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
    }

    .discard-btn:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.3);
        transform: translateY(-2px);
    }

    @media (max-width: 768px) {
        .modal-container {
            max-width: 95vw;
            max-height: 95vh;
        }

        .modal-header {
            padding: 1.5rem;
        }

        .header-left h2 {
            font-size: 1.25rem;
        }

        .image-container {
            padding: 1rem;
        }

        .action-buttons {
            flex-direction: column;
        }

        .action-btn {
            width: 100%;
        }
    }
</style>
