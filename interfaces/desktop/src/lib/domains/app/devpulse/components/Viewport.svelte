<!--
  @file src/lib/domains/app/devpulse/components/Viewport.svelte
  @name Viewport.svelte
  @module @devpulse/domains/app/devpulse/components/Viewport
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
