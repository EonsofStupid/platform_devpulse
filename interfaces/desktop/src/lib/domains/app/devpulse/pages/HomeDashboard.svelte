<!--
  @file src/lib/domains/app/devpulse/pages/HomeDashboard.svelte
  @name HomeDashboard.svelte
  @module @devpulse/domains/app/devpulse/pages/HomeDashboard
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
<script lang="ts">
    import TabSet from "$lib/design/primitives/TabSet.svelte";
    import Surface from "$lib/design/primitives/Surface.svelte";
</script>

<div class="home-dashboard">
    <TabSet tabs={["Overview", "Wireless", "WAN/LAN"]}>
        {#snippet children(activeTab: string)}
            {#if activeTab === "Overview"}
                <Surface variant="deep" class="panel">
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
                </Surface>
            {:else if activeTab === "Wireless"}
                <Surface variant="deep" class="panel">
                    <h2>Wireless Configuration</h2>
                    <p class="placeholder-text">
                        Wi-Fi settings and mesh network topology.
                    </p>
                </Surface>
            {:else if activeTab === "WAN/LAN"}
                <Surface variant="deep" class="panel">
                    <h2>Network Configuration</h2>
                    <p class="placeholder-text">
                        WAN gateway, LAN segments, DHCP pools.
                    </p>
                </Surface>
            {/if}
        {/snippet}
    </TabSet>
</div>

<style>
    .home-dashboard {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    :global(.panel) {
        padding: 1.5rem;
    }

    h2 {
        margin: 0 0 1rem 0;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
    }

    .stat-card {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
    }

    .stat-label {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #00ffcc;
        margin-top: 0.5rem;
    }

    .placeholder-text {
        color: rgba(255, 255, 255, 0.4);
    }
</style>
