<!--
  @file src/lib/sys/debug/vpb/components/VPBInspector.svelte
  @name VPBInspector.svelte
  @module @devpulse/sys/debug/vpb/components/VPBInspector
  @layer lib

  @description
  Independent Floating Inspector Window.
  Appears on scan selection. Draggable and dismissible.

  @dependencies
  - vpb-inspector.css
  - scan.state.ts
  - element-parser.ts
-->
<script lang="ts">
    import { scan } from "../state/scan.svelte";
    import {
        parseElement,
        formatForAI,
        type ParsedElement,
    } from "../scan/element-parser";
    import { toast } from "svelte-sonner";

    // Draggable Position State - Initialize with last click or default
    let position = $state(
        scan.clickPosition.x > 0
            ? scan.clickPosition
            : { x: window.innerWidth - 340, y: 100 },
    );

    // Update position if new click happens while open (optional, but good for re-clicking)
    $effect(() => {
        if (scan.inspectorOpen && scan.clickPosition.x > 0) {
            // Basic bounds check to prevent off-screen
            const safeX = Math.min(
                scan.clickPosition.x + 20,
                window.innerWidth - 320,
            );
            const safeY = Math.min(
                scan.clickPosition.y + 20,
                window.innerHeight - 400,
            );
            position = { x: safeX, y: safeY };
        }
    });

    let isDragging = $state(false);
    let dragOffset = $state({ x: 0, y: 0 });

    let copiedField = $state<string | null>(null);

    // Derived info
    const info = $derived<ParsedElement | null>(
        scan.selectedElement ? parseElement(scan.selectedElement) : null,
    );

    // Drag Handlers
    function onDragStart(e: MouseEvent) {
        isDragging = true;
        dragOffset = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    }

    function onDragMove(e: MouseEvent) {
        if (!isDragging) return;
        position = {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y,
        };
    }

    function onDragEnd() {
        isDragging = false;
    }

    // Actions
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

<svelte:window onmousemove={onDragMove} onmouseup={onDragEnd} />

{#if scan.inspectorOpen && info}
    <div
        class="vpb-inspector"
        style="left: {position.x}px; top: {position.y}px; transform: none; margin: 0;"
    >
        <!-- Header (Drag Handle) -->
        <div
            class="vpb-inspector__header"
            onmousedown={onDragStart}
            role="presentation"
            aria-label="Drag inspector window"
        >
            <h3 class="vpb-inspector__title">
                <span style="font-size: 16px;">🔍</span> Element Inspector
            </h3>
            <button
                class="vpb-tabs__control vpb-tabs__control--close"
                onclick={close}
                aria-label="Close inspector"
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="currentColor"
                >
                    <path
                        d="M11 3L3 11M3 3l8 8"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
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
                    title="Copy ID"
                >
                    📋
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
                    title="Copy classes"
                >
                    📋
                </button>
            </div>
        {/if}

        <!-- Source File (Mock) -->
        {#if info.sourceFile}
            <div class="vpb-inspector__row">
                <span class="vpb-inspector__label">File</span>
                <span class="vpb-inspector__value vpb-inspector__value--file"
                    >{info.sourceFile}</span
                >
            </div>
        {/if}

        <!-- Copy All Button -->
        <button
            class="vpb-copy-all"
            class:vpb-copy-all--copied={copiedField === "all"}
            onclick={copyAll}
        >
            <span>Copy All for AI Context</span>
        </button>
    </div>
{/if}
