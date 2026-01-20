<!--
  @file src/lib/domains/app/devpulse/pages/HomeDashboard.svelte
  @name HomeDashboard.svelte
  @module @devpulse/domains/app/devpulse/pages/HomeDashboard
  @layer lib

  @description
  Main dashboard page for DevPulse showing system overview stats.

  @since 1.0.0
-->
<script lang="ts">
    import { Tabs } from "bits-ui";
    import GlassPanel from "$lib/design/components/GlassPanel.svelte";

    let activeTab = $state("overview");
    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "wireless", label: "Wireless" },
        { id: "wan-lan", label: "WAN/LAN" },
    ];
</script>

<div class="home-dashboard">
    <Tabs.Root bind:value={activeTab} class="tabs-root">
        <Tabs.List class="tabs-list">
            {#each tabs as tab}
                <Tabs.Trigger value={tab.id} class="tabs-trigger">
                    {tab.label}
                </Tabs.Trigger>
            {/each}
        </Tabs.List>

        <div class="tabs-content-area">
            <Tabs.Content value="overview" class="tabs-content">
                <GlassPanel variant="deep" padding="lg">
                    <h2>System Overview</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="stat-label">Uptime</span>
                            <span class="stat-value">12d 4h 32m</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">CPU</span>
                            <span class="stat-value">24%</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Memory</span>
                            <span class="stat-value">8.2 GB</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-label">Network</span>
                            <span class="stat-value">1.2 Gbps</span>
                        </div>
                    </div>
                </GlassPanel>
            </Tabs.Content>

            <Tabs.Content value="wireless" class="tabs-content">
                <GlassPanel variant="deep" padding="lg">
                    <h2>Wireless Configuration</h2>
                    <p class="placeholder-text">
                        Wi-Fi settings and mesh network topology.
                    </p>
                </GlassPanel>
            </Tabs.Content>

            <Tabs.Content value="wan-lan" class="tabs-content">
                <GlassPanel variant="deep" padding="lg">
                    <h2>Network Configuration</h2>
                    <p class="placeholder-text">
                        WAN gateway, LAN segments, DHCP pools.
                    </p>
                </GlassPanel>
            </Tabs.Content>
        </div>
    </Tabs.Root>
</div>

<style>
    .home-dashboard {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: var(--space-4);
    }

    .tabs-root {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .tabs-list {
        display: flex;
        gap: var(--space-1);
        padding: var(--space-2);
        background: var(--surface-glass-void);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-4);
    }

    .tabs-trigger {
        padding: var(--space-2) var(--space-4);
        background: transparent;
        border: none;
        border-radius: var(--radius-sm);
        color: var(--text-muted);
        font-size: var(--text-sm);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
    }

    .tabs-trigger:hover {
        color: var(--text-secondary);
        background: var(--surface-glass-smoke);
    }

    .tabs-trigger[data-state="active"] {
        color: var(--text-white);
        background: var(--surface-glass-deep);
        box-shadow: var(--bevel-outset-subtle);
    }

    .tabs-content-area {
        flex: 1;
        overflow: auto;
    }

    .tabs-content {
        height: 100%;
    }

    h2 {
        margin: 0 0 1rem 0;
        font-weight: 600;
        color: var(--text-white);
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--space-4);
    }

    .stat-card {
        background: var(--surface-glass-void);
        border: var(--border-subtle);
        border-radius: var(--radius-md);
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
    }

    .stat-label {
        font-size: var(--text-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .stat-value {
        font-size: var(--text-xl);
        font-weight: 700;
        color: var(--signal-teal);
        margin-top: var(--space-2);
    }

    .placeholder-text {
        color: var(--text-muted);
    }
</style>
