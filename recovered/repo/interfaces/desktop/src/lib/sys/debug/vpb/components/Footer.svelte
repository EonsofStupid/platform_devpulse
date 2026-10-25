<!--
  @file src/lib/sys/debug/vpb/components/Footer.svelte
  @layer lib
  @description Standard Status Bar for VPB Shell.
  @since 1.0.0
-->
<script lang="ts">
    import { vpb } from "../state/vpb.svelte";
</script>

<div class="vpb-footer">
    <div class="vpb-status">
        <span
            class="vpb-indicator"
            data-state={vpb.scanActive ? "active" : "inactive"}
        ></span>
        <span class="vpb-text">
            {vpb.scanActive ? "Scanning..." : "Ready"}
        </span>
    </div>

    <div class="vpb-meta">
        <span class="vpb-version">v1.0.0</span>
    </div>
</div>

<style>
    .vpb-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 32px;
        padding: 0 var(--dp-space-3);
        border-top: 1px solid var(--dp-vpb-panel-border);
        background: var(--dp-vpb-surface-sunken);
        font-family: var(--dp-font-mono);
        font-size: var(--dp-text-xs);
        color: var(--dp-vpb-text-muted);
    }

    .vpb-status {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .vpb-indicator {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--dp-vpb-text-muted);
        transition: background-color var(--dp-vpb-transition-fast);
    }

    .vpb-indicator[data-state="active"] {
        background-color: var(--dp-vpb-action-play);
        box-shadow: 0 0 8px var(--dp-vpb-action-play);
    }
</style>
