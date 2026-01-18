<!--
    UIDemoPage - Design System Showcase
    Demonstrates glass recipes and ARIA primitives
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

    // Accordion items
    const accordionItems: AccordionItem[] = [
        {
            id: "glass",
            title: "Glass Recipes",
            content:
                "Composable glass utilities with blur, saturate, and glow borders.",
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
        <p class="demo-subtitle">Deep Glass • ARIA Primitives • OKLCH</p>
    </header>

    <!-- Glass Containers -->
    <section class="demo-section">
        <h2 class="section-title">Glass Containers</h2>
        <div class="demo-grid">
            <div class="glass demo-panel">
                <p class="panel-title">Base Glass</p>
                <p class="panel-sub">blur(16px) saturate(180%)</p>
            </div>
            <div class="glass-deep demo-panel">
                <p class="panel-title">Deep Glass</p>
                <p class="panel-sub">blur(20px) saturate(200%)</p>
            </div>
            <div class="glass-intense demo-panel">
                <p class="panel-title">Intense Glass</p>
                <p class="panel-sub">With outer glow</p>
            </div>
            <div class="glass-glow demo-panel">
                <p class="panel-title">Glow Glass</p>
                <p class="panel-sub">Animated pulse</p>
            </div>
        </div>
    </section>

    <!-- Glow Border -->
    <section class="demo-section">
        <h2 class="section-title">Glow Border (Animated)</h2>
        <div class="glass-glow-border demo-panel demo-panel-lg">
            <p class="panel-title">Rotating Gradient Border</p>
            <p class="panel-sub">conic-gradient with filter: blur</p>
        </div>
    </section>

    <!-- Tint Variants -->
    <section class="demo-section">
        <h2 class="section-title">Tint Variants</h2>
        <div class="demo-grid">
            <div class="glass glass-tint-teal demo-panel">
                <p class="panel-title">Teal</p>
            </div>
            <div class="glass glass-tint-purple demo-panel">
                <p class="panel-title">Purple</p>
            </div>
            <div class="glass glass-tint-gold demo-panel">
                <p class="panel-title">Gold</p>
            </div>
            <div class="glass glass-tint-coral demo-panel">
                <p class="panel-title">Coral</p>
            </div>
        </div>
    </section>

    <!-- Glass Buttons -->
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
        <div class="demo-row glass demo-panel" style="width: fit-content;">
            <Toggle bind:checked={toggleChecked} label="Enable feature" />
            <span class="panel-sub">Checked: {toggleChecked}</span>
        </div>
    </section>

    <!-- ARIA Accordion -->
    <section class="demo-section">
        <h2 class="section-title">ARIA Accordion</h2>
        <div class="glass demo-panel">
            <Accordion items={accordionItems} />
        </div>
    </section>

    <!-- ARIA Tabs -->
    <section class="demo-section">
        <h2 class="section-title">ARIA Tabs</h2>
        <div class="glass demo-panel">
            <Tabs tabs={tabItems}>
                {#snippet children({ activeTab })}
                    {#if activeTab === "containers"}
                        <p>Glass containers with blur and glow effects.</p>
                    {:else if activeTab === "buttons"}
                        <p>Interactive buttons with hover states.</p>
                    {:else if activeTab === "forms"}
                        <p>Form inputs with focus rings.</p>
                    {/if}
                {/snippet}
            </Tabs>
        </div>
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

    <!-- Effects -->
    <section class="demo-section">
        <h2 class="section-title">Effects</h2>
        <div class="demo-grid">
            <div class="glass glass-pulse demo-panel">
                <p class="panel-title">Pulse</p>
            </div>
            <div class="glass glass-electric demo-panel">
                <p class="panel-title">Electric</p>
            </div>
            <div class="glass glass-scanlines demo-panel">
                <p class="panel-title">Scanlines</p>
            </div>
        </div>
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
        margin-bottom: var(--dp-space-4);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .demo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--dp-space-4);
    }

    .demo-row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--dp-space-3);
        align-items: center;
    }

    .demo-panel {
        padding: var(--dp-space-4);
    }

    .demo-panel-lg {
        padding: var(--dp-space-6);
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
