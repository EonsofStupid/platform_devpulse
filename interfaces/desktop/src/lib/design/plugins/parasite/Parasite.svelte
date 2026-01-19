<!--
  @file src/lib/domains/plugins/parasite/Parasite.svelte
  @name Parasite.svelte
  @module @devpulse/plugins/parasite
  @layer plugins

  @description
  Composable ink-creep animation effect. Apply to any text.
  Uses COLD LIGHT tokens exclusively.

  @props
  - text: string - The text to display
  - size: "sm" | "md" | "lg" | "hero" - Size variant
  - animate: boolean - Enable ink-creep animation
  - enablePulse: boolean - Enable sporadic pulse overlay

  @since 1.0.0
-->
<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import "./parasite.css";

    // Types
    type Size = "sm" | "md" | "lg" | "hero";

    interface Props {
        text?: string;
        size?: Size;
        animate?: boolean;
        enablePulse?: boolean;
    }

    let {
        text = "DevPULSE",
        size = "md",
        animate = true,
        enablePulse = true,
    }: Props = $props();

    // Split text into individual letters
    const letters = $derived(text.split(""));

    // Sporadic pulse state
    let isPulsing = $state(false);
    let pulseInterval: ReturnType<typeof setTimeout> | null = null;

    function triggerRandomPulse() {
        isPulsing = true;
        setTimeout(() => {
            isPulsing = false;
        }, 500);
    }

    function startPulseLoop() {
        if (!enablePulse) return;

        const randomDelay = () => Math.random() * 7000 + 8000; // 8-15s

        const scheduleNext = () => {
            pulseInterval = setTimeout(() => {
                triggerRandomPulse();
                scheduleNext();
            }, randomDelay());
        };

        scheduleNext();
    }

    onMount(() => {
        if (enablePulse) {
            startPulseLoop();
        }
    });

    onDestroy(() => {
        if (pulseInterval) {
            clearTimeout(pulseInterval);
        }
    });
</script>

<span
    class="parasite"
    data-size={size}
    data-animate={animate}
    data-pulse={isPulsing}
>
    {#each letters as letter, i}
        <span class="parasite-letter" style="animation-delay: {i * 0.3}s">
            {letter}
        </span>
    {/each}
</span>
