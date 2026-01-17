<script>
    import { global } from "$lib/sys/runes/global.svelte";
    import Frame from "$lib/layouts/app/Frame.svelte";

    // Domain Pages
    import HomeDashboard from "$lib/domains/app/devpulse/pages/HomeDashboard.svelte";
    import Demo from "$lib/design/Demo.svelte";
    // Overmind Dashboard import (future proofing)
    // import OvermindDashboard from '$lib/domains/app/overmind/OvermindDashboard.svelte';
</script>

<Frame>
    {#key global.current_domain}
        <div class="domain-swapper">
            {#if global.current_domain === "devpulse"}
                <HomeDashboard />
            {:else if global.current_domain === "overmind"}
                <div class="placeholder">OverMind Dashboard (Coming Soon)</div>
            {:else if global.current_domain === "wiredfront"}
                <div class="placeholder">WiredFront Media (Coming Soon)</div>
            {:else}
                <div class="placeholder">Unknown: {global.current_domain}</div>
            {/if}
        </div>
    {/key}
</Frame>

<style>
    /* Domain Swapper Animation */
    .domain-swapper {
        width: 100%;
        height: 100%;
        animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slide-up {
        from {
            opacity: 0;
            transform: translateY(20px);
            filter: blur(4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
        }
    }

    .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 2rem;
        color: rgba(255, 255, 255, 0.2);
    }
</style>
