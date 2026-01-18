<!--
  VPBInspector.svelte
  Element details panel with copy buttons - uses recipes from lib/design/vpb-inspector.css
-->
<script lang="ts">
    import { scan } from "../state/scan.svelte";
    import {
        parseElement,
        formatForAI,
        type ParsedElement,
    } from "../scan/element-parser";
    import { toast } from "svelte-sonner";

    let copiedField = $state<string | null>(null);

    // Parse selected element
    const info = $derived<ParsedElement | null>(
        scan.selectedElement ? parseElement(scan.selectedElement) : null,
    );

    async function copyToClipboard(text: string, field: string) {
        try {
            await navigator.clipboard.writeText(text);
            copiedField = field;
            toast.success(`Copied ${field}`);

            setTimeout(() => {
                copiedField = null;
            }, 2000);
        } catch {
            toast.error("Failed to copy");
        }
    }

    async function copyAll() {
        if (!info) return;

        const text = formatForAI(info);
        await copyToClipboard(text, "all");
    }

    function close() {
        scan.closeInspector();
    }
</script>

{#if scan.inspectorOpen && info}
    <div class="vpb-inspector">
        <!-- Header -->
        <div class="vpb-inspector__header">
            <h3 class="vpb-inspector__title">Element Inspector</h3>
            <button
                class="vpb-btn vpb-btn--close"
                onclick={close}
                aria-label="Close inspector"
            >
                <svg width="12" height="12" viewBox="0 0 12 12">
                    <path
                        d="M2 2l8 8m0-8l-8 8"
                        stroke="currentColor"
                        stroke-width="1.5"
                        fill="none"
                    />
                </svg>
            </button>
        </div>

        <!-- Tag -->
        <div class="vpb-inspector__row">
            <span class="vpb-inspector__label">Tag</span>
            <span class="vpb-inspector__value">&lt;{info.tagName}&gt;</span>
        </div>

        <!-- ID -->
        {#if info.id}
            <div class="vpb-inspector__row">
                <span class="vpb-inspector__label">ID</span>
                <span class="vpb-inspector__value">#{info.id}</span>
                <button
                    class="vpb-copy-btn"
                    class:vpb-copy-btn--copied={copiedField === "id"}
                    onclick={() => copyToClipboard(info.id!, "id")}
                    aria-label="Copy ID"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                        <rect
                            x="3"
                            y="3"
                            width="6"
                            height="8"
                            stroke="currentColor"
                            fill="none"
                        />
                        <rect
                            x="1"
                            y="1"
                            width="6"
                            height="8"
                            stroke="currentColor"
                            fill="none"
                        />
                    </svg>
                </button>
            </div>
        {/if}

        <!-- Classes -->
        {#if info.classList.length > 0}
            <div class="vpb-inspector__row">
                <span class="vpb-inspector__label">Classes</span>
                <span class="vpb-inspector__value"
                    >.{info.classList.join(" .")}</span
                >
                <button
                    class="vpb-copy-btn"
                    class:vpb-copy-btn--copied={copiedField === "classes"}
                    onclick={() =>
                        copyToClipboard(info.classList.join(" "), "classes")}
                    aria-label="Copy classes"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                        <rect
                            x="3"
                            y="3"
                            width="6"
                            height="8"
                            stroke="currentColor"
                            fill="none"
                        />
                        <rect
                            x="1"
                            y="1"
                            width="6"
                            height="8"
                            stroke="currentColor"
                            fill="none"
                        />
                    </svg>
                </button>
            </div>
        {/if}

        <!-- Source File -->
        {#if info.sourceFile}
            <div class="vpb-inspector__row">
                <span class="vpb-inspector__label">File</span>
                <span class="vpb-inspector__value vpb-inspector__value--file"
                    >{info.sourceFile}</span
                >
                <button
                    class="vpb-copy-btn"
                    class:vpb-copy-btn--copied={copiedField === "file"}
                    onclick={() => copyToClipboard(info.sourceFile!, "file")}
                    aria-label="Copy file path"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                        <rect
                            x="3"
                            y="3"
                            width="6"
                            height="8"
                            stroke="currentColor"
                            fill="none"
                        />
                        <rect
                            x="1"
                            y="1"
                            width="6"
                            height="8"
                            stroke="currentColor"
                            fill="none"
                        />
                    </svg>
                </button>
            </div>
        {/if}

        <!-- CSS Chain -->
        {#if info.cssChain.length > 0}
            <div class="vpb-inspector__section">
                <span class="vpb-inspector__label">CSS Chain</span>
                <ul class="vpb-css-chain">
                    {#each info.cssChain as file}
                        <li class="vpb-css-chain__item">{file}</li>
                    {/each}
                </ul>
                <button
                    class="vpb-copy-btn"
                    class:vpb-copy-btn--copied={copiedField === "css"}
                    onclick={() =>
                        copyToClipboard(info.cssChain.join("\n"), "css")}
                    aria-label="Copy CSS chain"
                >
                    <svg width="12" height="12" viewBox="0 0 12 12">
                        <rect
                            x="3"
                            y="3"
                            width="6"
                            height="8"
                            stroke="currentColor"
                            fill="none"
                        />
                        <rect
                            x="1"
                            y="1"
                            width="6"
                            height="8"
                            stroke="currentColor"
                            fill="none"
                        />
                    </svg>
                </button>
            </div>
        {/if}

        <!-- Copy All Button -->
        <button
            class="vpb-copy-all"
            class:vpb-copy-all--copied={copiedField === "all"}
            onclick={copyAll}
        >
            <svg width="14" height="14" viewBox="0 0 14 14">
                <rect
                    x="4"
                    y="4"
                    width="7"
                    height="9"
                    stroke="currentColor"
                    fill="none"
                />
                <rect
                    x="2"
                    y="2"
                    width="7"
                    height="9"
                    stroke="currentColor"
                    fill="none"
                />
            </svg>
            <span>Copy All for AI Context</span>
        </button>
    </div>
{/if}

<style>
    .vpb-inspector__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--vpb-space-md);
    }

    .vpb-inspector__title {
        font-size: 14px;
        font-weight: 600;
        color: var(--vpb-text-primary);
        margin: 0;
    }

    .vpb-inspector__section {
        display: flex;
        flex-direction: column;
        gap: var(--vpb-space-xs);
    }
</style>
