<!--
    UIDemoPage - Design System Showcase
    Demonstrates panel recipes and ARIA primitives
-->
<script lang="ts">
    import {
        Button,
        Accordion,
        Toggle,
        Tabs,
        Dialog,
    } from "$lib/design/primitives";
    import type { AccordionItem, TabItem } from "$lib/design/primitives";
    import Panel from "$lib/design/components/Panel.svelte";

    // Accordion items
    const accordionItems: AccordionItem[] = [
        {
            id: "panels",
            title: "Panel Recipes",
            content:
                "Glass (flush dual-tint) and Matte Inset (sunken content area) panels.",
        },
        {
            id: "tokens",
            title: "Design Tokens",
            content:
                "OKLCH colors, fluid typography, spacing, and transitions.",
        },
        {
            id: "aria",
            title: "ARIA Primitives",
            content: "Custom accessible components with keyboard navigation.",
        },
    ];

    // Tab items
    const tabItems: TabItem[] = [
        { id: "containers", label: "Containers" },
        { id: "buttons", label: "Buttons" },
        { id: "forms", label: "Forms" },
    ];

    let toggleChecked = $state(false);
    let dialogOpen = $state(false);
</script>

<div class="demo-page">
    <header class="demo-header">
        <h1 class="demo-title">DevPulse Design System</h1>
        <p class="demo-subtitle">Panel Recipes • ARIA Primitives • OKLCH</p>
    </header>

    <!-- NEW: Panel Recipes -->
    <section class="demo-section">
        <h2 class="section-title">Panel Recipes</h2>
        <p class="section-desc">
            Two composable recipes: Glass (flush) and Matte Inset (sunken)
        </p>

        <div class="demo-compare">
            <Panel variant="glass">
                <div class="panel-content">
                    <p class="panel-title">Glass Panel</p>
                    <p class="panel-sub">Flush surface, dual-tint gradient</p>
                    <p class="panel-sub">
                        Teal (top-left) → Purple (bottom-right)
                    </p>
                </div>
            </Panel>

            <Panel variant="matte">
                <div class="panel-content">
                    <p class="panel-title">Matte Inset Panel</p>
                    <p class="panel-sub">Sunken content, stamped edges</p>
                    <p class="panel-sub">Laser border, purple fade at bottom</p>
                </div>
            </Panel>
        </div>
    </section>

    <!-- Panel Size Variants -->
    <section class="demo-section">
        <h2 class="section-title">Panel Sizes</h2>
        <div class="demo-grid-3">
            <Panel variant="glass" size="sm">
                <div class="panel-content">
                    <p class="panel-title">Small</p>
                    <p class="panel-sub">Tight gap</p>
                </div>
            </Panel>
            <Panel variant="glass" size="md">
                <div class="panel-content">
                    <p class="panel-title">Medium</p>
                    <p class="panel-sub">Default gap</p>
                </div>
            </Panel>
            <Panel variant="glass" size="lg">
                <div class="panel-content">
                    <p class="panel-title">Large</p>
                    <p class="panel-sub">Wide gap</p>
                </div>
            </Panel>
        </div>
    </section>

    <!-- Matte Panel Variants -->
    <section class="demo-section">
        <h2 class="section-title">Matte Inset Sizes</h2>
        <div class="demo-grid-3">
            <Panel variant="matte" size="sm">
                <div class="panel-content">
                    <p class="panel-title">Small Matte</p>
                </div>
            </Panel>
            <Panel variant="matte" size="md">
                <div class="panel-content">
                    <p class="panel-title">Medium Matte</p>
                </div>
            </Panel>
            <Panel variant="matte" size="lg">
                <div class="panel-content">
                    <p class="panel-title">Large Matte</p>
                </div>
            </Panel>
        </div>
    </section>

    <!-- Glass Buttons (keep existing) -->
    <section class="demo-section">
        <h2 class="section-title">Glass Buttons</h2>
        <div class="demo-row">
            <button class="glass-button">Default</button>
            <button class="glass-button glass-button-primary">Primary</button>
            <button class="glass-button glass-tint-teal">Teal</button>
            <button class="glass-button glass-tint-purple">Purple</button>
        </div>
    </section>

    <!-- ARIA Button -->
    <section class="demo-section">
        <h2 class="section-title">ARIA Button Primitive</h2>
        <div class="demo-row">
            <Button class="glass-button" onclick={() => alert("Clicked!")}
                >ARIA Button</Button
            >
            <Button class="glass-button glass-button-primary" loading
                >Loading...</Button
            >
            <Button class="glass-button" disabled>Disabled</Button>
            <Button class="glass-button" href="https://example.com"
                >Link Button</Button
            >
        </div>
    </section>

    <!-- Glass Input -->
    <section class="demo-section">
        <h2 class="section-title">Glass Input</h2>
        <div class="demo-row">
            <input
                class="glass-input"
                placeholder="Type something..."
                style="max-width: 300px;"
            />
        </div>
    </section>

    <!-- ARIA Toggle -->
    <section class="demo-section">
        <h2 class="section-title">ARIA Toggle</h2>
        <Panel variant="glass" size="sm">
            <div class="demo-row">
                <Toggle bind:checked={toggleChecked} label="Enable feature" />
                <span class="panel-sub">Checked: {toggleChecked}</span>
            </div>
        </Panel>
    </section>

    <!-- ARIA Accordion -->
    <section class="demo-section">
        <h2 class="section-title">ARIA Accordion</h2>
        <Panel variant="matte">
            <Accordion items={accordionItems} />
        </Panel>
    </section>

    <!-- ARIA Tabs -->
    <section class="demo-section">
        <h2 class="section-title">ARIA Tabs</h2>
        <Panel variant="glass">
            <Tabs tabs={tabItems}>
                {#snippet children({ activeTab })}
                    {#if activeTab === "containers"}
                        <p>
                            Glass and Matte panel recipes with composable depth.
                        </p>
                    {:else if activeTab === "buttons"}
                        <p>Interactive buttons with hover states.</p>
                    {:else if activeTab === "forms"}
                        <p>Form inputs with focus rings.</p>
                    {/if}
                {/snippet}
            </Tabs>
        </Panel>
    </section>

    <!-- ARIA Dialog -->
    <section class="demo-section">
        <h2 class="section-title">ARIA Dialog</h2>
        <Button
            class="glass-button glass-button-primary"
            onclick={() => (dialogOpen = true)}
        >
            Open Dialog
        </Button>
        <Dialog bind:open={dialogOpen} title="Example Dialog">
            <div
                class="glass-scrim"
                style="position: fixed; inset: 0; z-index: -1;"
            ></div>
            <p style="margin-bottom: var(--dp-space-4);">
                This is a modal dialog with focus trap and Escape to close.
            </p>
            <Button class="glass-button" onclick={() => (dialogOpen = false)}
                >Close</Button
            >
        </Dialog>
    </section>
</div>

<style>
    .demo-page {
        padding: var(--dp-space-8);
        min-height: 100vh;
        overflow-y: auto;
    }

    .demo-header {
        text-align: center;
        margin-bottom: var(--dp-space-8);
    }

    .demo-title {
        font-size: var(--dp-text-4xl);
        font-weight: var(--dp-font-extrabold);
        color: var(--dp-text-primary);
        margin: 0;
        background: linear-gradient(
            135deg,
            var(--dp-teal-300),
            var(--dp-purple-300)
        );
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .demo-subtitle {
        font-family: var(--dp-font-mono);
        font-size: var(--dp-text-sm);
        color: var(--dp-text-muted);
        margin-top: var(--dp-space-2);
    }

    .demo-section {
        margin-bottom: var(--dp-space-8);
    }

    .section-title {
        font-size: var(--dp-text-xl);
        font-weight: var(--dp-font-semibold);
        color: var(--dp-text-secondary);
        margin-bottom: var(--dp-space-3);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .section-desc {
        font-size: var(--dp-text-sm);
        color: var(--dp-text-muted);
        margin-bottom: var(--dp-space-4);
    }

    .demo-compare {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--dp-space-4);
    }

    .demo-grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--dp-space-4);
    }

    .demo-row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--dp-space-3);
        align-items: center;
    }

    .panel-content {
        padding: var(--dp-space-2);
    }

    .panel-title {
        font-size: var(--dp-text-base);
        font-weight: var(--dp-font-medium);
        color: var(--dp-text-primary);
        margin: 0;
    }

    .panel-sub {
        font-size: var(--dp-text-sm);
        color: var(--dp-text-muted);
        font-family: var(--dp-font-mono);
        margin: var(--dp-space-1) 0 0 0;
    }
</style>
