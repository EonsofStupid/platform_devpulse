<!--
  @file src/lib/domains/app/devpulse/components/Carousel.svelte
  @name Carousel.svelte
  @module @devpulse/domains/app/devpulse/components/Carousel
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
import { run } from "svelte/legacy";

// INTERFACE: The Carousel accepts a list of items and an onSelect callback.
// State is local (Runes) or passed down.

let { items = [], onSelect } = $props();

// State
let activeIndex = $state(0);

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "ArrowRight") {
		activeIndex = (activeIndex + 1) % items.length;
	} else if (e.key === "ArrowLeft") {
		activeIndex = (activeIndex - 1 + items.length) % items.length;
	} else if (e.key === "Enter") {
		onSelect(items[activeIndex]);
	}
}

function select(index: number) {
	activeIndex = index;
	onSelect(items[index]);
}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="carousel-container">
    <div class="carousel-track">
        {#each items as item, i}
            <button
                class="carousel-card"
                class:active={i === activeIndex}
                onclick={() => select(i)}
            >
                <div class="icon">{item.icon}</div>
                <div class="label">{item.label}</div>
            </button>
        {/each}
    </div>
</div>

<style>
    .carousel-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        perspective: 1000px;
    }

    .carousel-track {
        display: flex;
        gap: 2rem;
        transform-style: preserve-3d;
    }

    .carousel-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        width: 200px;
        height: 300px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        cursor: pointer;
        backdrop-filter: blur(10px);
    }

    .carousel-card.active {
        transform: scale(1.1) translateZ(20px);
        border-color: var(--color-primary-500, #00ffcc);
        background: rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 30px rgba(0, 255, 204, 0.2);
    }

    .icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .label {
        font-size: 1.2rem;
        font-weight: 600;
        letter-spacing: 0.5px;
    }
</style>
