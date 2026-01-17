<!--
    Design System Demo Page
    Shows all components with their variants
-->
<script lang="ts">
    import {
        GlassPanel,
        Button,
        Input,
        Toggle,
        Card,
        Badge,
    } from "$lib/design/components";

    let toggleState = $state(false);
    let inputValue = $state("");
</script>

<div class="demo-page">
    <h1 class="demo-title">DevPulse Design System</h1>
    <p class="demo-subtitle">OKLCH • Glass • ARIA</p>

    <!-- GlassPanel Section -->
    <section class="demo-section">
        <h2>GlassPanel</h2>
        <div class="demo-row">
            <GlassPanel variant="void" class="demo-panel">
                <p>Void</p>
            </GlassPanel>
            <GlassPanel variant="deep" class="demo-panel">
                <p>Deep</p>
            </GlassPanel>
            <GlassPanel variant="smoke" class="demo-panel">
                <p>Smoke</p>
            </GlassPanel>
            <GlassPanel variant="frost" class="demo-panel">
                <p>Frost</p>
            </GlassPanel>
        </div>
        <div class="demo-row">
            <GlassPanel glow="teal" class="demo-panel">
                <p>Teal Glow</p>
            </GlassPanel>
            <GlassPanel glow="purple" class="demo-panel">
                <p>Purple Glow</p>
            </GlassPanel>
            <GlassPanel glow="pink" class="demo-panel">
                <p>Pink Glow</p>
            </GlassPanel>
            <GlassPanel glow="ember" class="demo-panel">
                <p>Ember Glow</p>
            </GlassPanel>
        </div>
    </section>

    <!-- Button Section -->
    <section class="demo-section">
        <h2>Button</h2>
        <div class="demo-row">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" glow>With Glow</Button>
        </div>
        <div class="demo-row">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
        </div>
    </section>

    <!-- Input Section -->
    <section class="demo-section">
        <h2>Input</h2>
        <div class="demo-row">
            <Input
                placeholder="Type here..."
                bind:value={inputValue}
                label="Demo input"
            />
        </div>
        <div class="demo-row">
            <Input
                type="password"
                placeholder="Password"
                label="Password input"
            />
            <Input disabled placeholder="Disabled" label="Disabled input" />
        </div>
    </section>

    <!-- Toggle Section -->
    <section class="demo-section">
        <h2>Toggle</h2>
        <div class="demo-row">
            <Toggle bind:checked={toggleState} label="Demo toggle" />
            <span class="demo-label">{toggleState ? "ON" : "OFF"}</span>
            <Toggle disabled label="Disabled toggle" />
        </div>
    </section>

    <!-- Card Section -->
    <section class="demo-section">
        <h2>Card</h2>
        <div class="demo-row">
            <Card padding="md">
                <h3>Default Card</h3>
                <p>Content goes here</p>
            </Card>
            <Card variant="interactive" glow="teal">
                <h3>Interactive + Glow</h3>
                <p>Hover me</p>
            </Card>
        </div>
    </section>

    <!-- Badge Section -->
    <section class="demo-section">
        <h2>Badge</h2>
        <div class="demo-row">
            <Badge variant="teal">Teal</Badge>
            <Badge variant="purple">Purple</Badge>
            <Badge variant="pink">Pink</Badge>
            <Badge variant="ember">Ember</Badge>
            <Badge variant="muted">Muted</Badge>
        </div>
    </section>
</div>

<style>
    .demo-page {
        padding: var(--space-8);
        min-height: 100vh;
        background: var(--void-950);
        color: var(--text-primary);
    }

    .demo-title {
        font-size: var(--text-3xl);
        font-weight: 800;
        margin-bottom: var(--space-2);
        background: linear-gradient(
            135deg,
            var(--teal-400),
            var(--purple-400),
            var(--pink-400)
        );
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .demo-subtitle {
        font-family: var(--font-mono);
        color: var(--text-muted);
        margin-bottom: var(--space-8);
    }

    .demo-section {
        margin-bottom: var(--space-8);
    }

    .demo-section h2 {
        font-size: var(--text-xl);
        color: var(--text-secondary);
        margin-bottom: var(--space-4);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .demo-section h3 {
        font-size: var(--text-lg);
        margin-bottom: var(--space-2);
    }

    .demo-section p {
        color: var(--text-secondary);
    }

    .demo-row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        align-items: center;
        margin-bottom: var(--space-4);
    }

    .demo-panel {
        padding: var(--space-4);
        min-width: 120px;
        text-align: center;
    }

    .demo-label {
        font-family: var(--font-mono);
        color: var(--text-muted);
    }
</style>
