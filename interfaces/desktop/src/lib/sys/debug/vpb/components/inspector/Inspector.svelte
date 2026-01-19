<!--
  @file src/lib/sys/debug/vpb/components/inspector/Inspector.svelte
  @layer lib
  @description Inspector Details View (Properties Panel).
  @since 1.0.0
-->
<script lang="ts">
    import { scan } from "./state";
    import { toast } from "svelte-sonner";
    // We should move parser logic here or import it. Existing code imported "scan/element-parser".
    // I will assume for now we use the state's elementInfo directly if possible, or keep the parser import.
    // The previous file imported: import { parseElement, formatForAI } from "../scan/element-parser";
    // I'll check if element-parser exists or if I should inline basic parsing since state now has it?
    // scan.state.ts has parseElement logic inside the class. scan.elementInfo IS the parsed element.
    // So we don't need external parser! scan.elementInfo is already populated.

    // Derived info
    const info = $derived(scan.elementInfo);
    let copiedField = $state<string | null>(null);

    async function copyToClipboard(text: string, field: string) {
        try {
            await navigator.clipboard.writeText(text);
            copiedField = field;
            toast.success(`Copied ${field}`);
            setTimeout(() => (copiedField = null), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    }

    // Quick helper to format for AI (Synthesis)
    function formatForAI(data: any) {
        return JSON.stringify(
            {
                tag: data.tagName,
                id: data.id,
                classes: data.classList,
                styles: data.computedStyles,
                source: data.sourceFile,
            },
            null,
            2,
        );
    }
</script>

{#if info}
    <div class="vpb-inspector-view">
        <!-- Identity Section -->
        <div class="vpb-section">
            <h4 class="vpb-section-title">Identity</h4>

            <!-- Tag -->
            <div class="vpb-row">
                <span class="vpb-label">Tag</span>
                <code class="vpb-value text-primary"
                    >&lt;{info.tagName}&gt;</code
                >
            </div>

            <!-- ID -->
            {#if info.id}
                <div class="vpb-row">
                    <span class="vpb-label">ID</span>
                    <div class="vpb-value-group">
                        <code class="vpb-value">#{info.id}</code>
                        <button
                            class="vpb-icon-btn"
                            onclick={() => copyToClipboard(info.id!, "id")}
                            >📋</button
                        >
                    </div>
                </div>
            {/if}

            <!-- Source (P0) -->
            {#if info.sourceFile}
                <div class="vpb-row">
                    <span class="vpb-label">Source</span>
                    <div class="vpb-value-group">
                        <code class="vpb-value text-xs"
                            >{info.sourceFile}{#if info.lineNumbers}:{info
                                    .lineNumbers.start}{/if}</code
                        >
                    </div>
                </div>
            {/if}
        </div>

        <!-- Class List -->
        {#if info.classList.length > 0}
            <div class="vpb-section">
                <div class="vpb-section-header">
                    <h4 class="vpb-section-title">Classes</h4>
                    <button
                        class="vpb-icon-btn"
                        onclick={() =>
                            copyToClipboard(
                                info.classList.join(" "),
                                "classes",
                            )}>📋</button
                    >
                </div>
                <div class="vpb-chip-grid">
                    {#each info.classList as cls}
                        <span class="vpb-chip">.{cls}</span>
                    {/each}
                </div>
            </div>
        {/if}

        <!-- Actions -->
        <div class="vpb-section">
            <button
                class="vpb-btn-full"
                onclick={() => copyToClipboard(formatForAI(info), "all")}
            >
                <span>Copy Context for AI</span>
            </button>
        </div>
    </div>
{:else}
    <div class="p-4 text-center text-muted">No element selected</div>
{/if}

<style>
    .vpb-inspector-view {
        padding: var(--dp-space-3);
        display: flex;
        flex-direction: column;
        gap: var(--dp-space-4);
    }

    .vpb-section {
        display: flex;
        flex-direction: column;
        gap: var(--dp-space-2);
    }

    .vpb-section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .vpb-section-title {
        font-size: var(--dp-text-xs);
        font-weight: 700;
        text-transform: uppercase;
        color: var(--dp-vpb-text-secondary);
        letter-spacing: 0.05em;
        margin: 0;
    }

    .vpb-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: var(--dp-font-mono);
        font-size: var(--dp-text-xs);
    }

    .vpb-label {
        color: var(--dp-vpb-text-muted);
    }

    .vpb-value-group {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .vpb-value {
        color: var(--dp-vpb-text-primary);
    }
    .text-primary {
        color: var(--dp-vpb-action-play);
    }
    .text-xs {
        font-size: 10px;
    }

    .vpb-chip-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .vpb-chip {
        font-family: var(--dp-font-mono);
        font-size: 10px;
        background: var(--dp-vpb-surface-sunken);
        color: var(--dp-teal-400);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--dp-vpb-panel-border);
    }

    .vpb-icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 12px;
        opacity: 0.6;
        padding: 0;
    }
    .vpb-icon-btn:hover {
        opacity: 1;
    }

    .vpb-btn-full {
        width: 100%;
        padding: 8px;
        background: var(--dp-vpb-surface-sunken);
        border: 1px solid var(--dp-vpb-panel-border);
        color: var(--dp-vpb-text-primary);
        font-family: var(--dp-font-mono);
        font-size: var(--dp-text-xs);
        cursor: pointer;
        border-radius: var(--dp-radius-md);
        transition: all 0.2s;
    }
    .vpb-btn-full:hover {
        background: var(--dp-vpb-surface-base);
        border-color: var(--dp-vpb-action-play);
    }
</style>
