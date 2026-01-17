<script lang="ts">
    import { appState } from "$lib/sys/app_state.svelte";
</script>

<div class="topbar">
    <div class="breadcrumbs">
        <span class="crumb root">DevPulse</span>
        <span class="sep">/</span>
        <span class="crumb active">{appState.current_view}</span>
    </div>

    <div class="actions">
        <!-- Placeholder for User/Settings -->
        <div class="user-badge">JH</div>
    </div>
</div>

<style>
    .topbar {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .breadcrumbs {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
        display: flex;
        gap: 0.5rem;
    }

    .crumb.active {
        color: #fff;
    }

    .user-badge {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #333;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: bold;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
</style>
