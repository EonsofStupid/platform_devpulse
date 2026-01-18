<!--
  @file src/lib/design/primitives/Accordion.svelte
  @name Accordion.svelte
  @module @devpulse/design/primitives/Accordion
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
    Accordion.svelte - Custom ARIA Accordion Primitive
    
    WAI-ARIA compliant accordion:
    - role="button" on headers
    - aria-expanded state
    - aria-controls linking
    - Keyboard: Enter/Space to toggle, Arrow keys optional
-->
<script lang="ts" module>
    export interface AccordionItem {
        id: string;
        title: string;
        content: string;
    }
</script>

<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        /** Array of accordion items */
        items: AccordionItem[];
        /** Allow multiple panels open */
        multiple?: boolean;
        /** Default open panel IDs */
        defaultOpen?: string[];
        /** Additional CSS class */
        class?: string;
        /** Custom header renderer */
        headerSnippet?: Snippet<[{ item: AccordionItem; isOpen: boolean }]>;
        /** Custom content renderer */
        contentSnippet?: Snippet<[{ item: AccordionItem }]>;
    }

    let {
        items,
        multiple = false,
        defaultOpen = [],
        class: className = "",
        headerSnippet,
        contentSnippet,
    }: Props = $props();

    let openPanels = $state<Set<string>>(new Set(defaultOpen));

    function toggle(id: string) {
        if (multiple) {
            if (openPanels.has(id)) {
                openPanels.delete(id);
            } else {
                openPanels.add(id);
            }
            openPanels = new Set(openPanels);
        } else {
            openPanels = openPanels.has(id) ? new Set() : new Set([id]);
        }
    }

    function handleKeydown(event: KeyboardEvent, id: string) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle(id);
        }
    }

    function isOpen(id: string): boolean {
        return openPanels.has(id);
    }
</script>

<div class="dp-accordion {className}" role="presentation">
    {#each items as item (item.id)}
        {@const panelId = `panel-${item.id}`}
        {@const headerId = `header-${item.id}`}
        {@const expanded = isOpen(item.id)}

        <div
            class="dp-accordion-item"
            data-state={expanded ? "open" : "closed"}
        >
            <!-- Header -->
            <h3 class="dp-accordion-header">
                <button
                    id={headerId}
                    class="dp-accordion-trigger"
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onclick={() => toggle(item.id)}
                    onkeydown={(e) => handleKeydown(e, item.id)}
                >
                    {#if headerSnippet}
                        {@render headerSnippet({ item, isOpen: expanded })}
                    {:else}
                        <span class="dp-accordion-title">{item.title}</span>
                        <span class="dp-accordion-icon" aria-hidden="true">
                            {expanded ? "−" : "+"}
                        </span>
                    {/if}
                </button>
            </h3>

            <!-- Panel -->
            <div
                id={panelId}
                class="dp-accordion-panel"
                role="region"
                aria-labelledby={headerId}
                hidden={!expanded}
            >
                <div class="dp-accordion-content">
                    {#if contentSnippet}
                        {@render contentSnippet({ item })}
                    {:else}
                        {item.content}
                    {/if}
                </div>
            </div>
        </div>
    {/each}
</div>

<style>
    .dp-accordion {
        display: flex;
        flex-direction: column;
        gap: var(--dp-space-2);
    }

    .dp-accordion-item {
        border-radius: var(--dp-radius);
        overflow: hidden;
    }

    .dp-accordion-header {
        margin: 0;
    }

    .dp-accordion-trigger {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        gap: var(--dp-space-3);
        padding: var(--dp-space-3) var(--dp-space-4);
        background: none;
        border: none;
        color: inherit;
        font: inherit;
        font-weight: var(--dp-font-medium);
        text-align: left;
        cursor: pointer;
        transition: background var(--dp-transition-fast);
    }

    .dp-accordion-trigger:focus-visible {
        outline: 2px solid var(--dp-teal-400);
        outline-offset: -2px;
    }

    .dp-accordion-title {
        flex: 1;
    }

    .dp-accordion-icon {
        font-size: 1.25em;
        transition: transform var(--dp-transition-fast);
    }

    .dp-accordion-item[data-state="open"] .dp-accordion-icon {
        transform: rotate(0deg);
    }

    .dp-accordion-panel {
        overflow: hidden;
    }

    .dp-accordion-panel[hidden] {
        display: none;
    }

    .dp-accordion-content {
        padding: var(--dp-space-3) var(--dp-space-4);
    }
</style>
