<script lang="ts">
    // The Viewport container that sits between TopBar and StatusBar.
    // It manages its own scroll state.
    let { children } = $props();
</script>

<div class="viewport-scroller">
    <div class="viewport-content">
        {@render children()}
    </div>
</div>

<style>
    .viewport-scroller {
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
        /* Custom Scrollbar styling would go here */
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }

    .viewport-content {
        max-width: 1600px;
        margin: 0 auto;
        padding: 2rem;
    }
</style>
