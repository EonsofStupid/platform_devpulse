<!--
  @file primitives/Presence.svelte
  @layer primitives

  Mount/unmount with animation support.
  Deterministic lifecycle: entered → exiting → removed.
  Respects prefers-reduced-motion (instant removal, no animation).
  Never leaves ghost nodes in DOM.
-->
<script lang="ts" module>
export type PresenceState = "entered" | "exiting" | "removed";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";

  interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
    /** Whether content should be present */
    present: boolean;
    /** Content to render when present */
    children?: Snippet<[{ state: PresenceState }]>;
    /** Called when exit animation completes */
    onExitComplete?: () => void;
  }

  let {
    present,
    children,
    onExitComplete,
    class: className = "",
    "data-id": id,
  }: Props = $props();

  // Track lifecycle state
  let presenceState: PresenceState = $state(present ? "entered" : "removed");
  let node: HTMLDivElement | undefined = $state();

  // Check reduced motion preference (SSR-safe)
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Handle present changes
  $effect(() => {
    if (present) {
      presenceState = "entered";
    } else if (presenceState === "entered") {
      if (prefersReducedMotion) {
        // Instant removal for reduced motion
        presenceState = "removed";
        onExitComplete?.();
      } else {
        presenceState = "exiting";
      }
    }
  });

  // Handle animation end
  function handleAnimationEnd() {
    if (presenceState === "exiting") {
      presenceState = "removed";
      onExitComplete?.();
    }
  }

  function handleTransitionEnd() {
    if (presenceState === "exiting") {
      presenceState = "removed";
      onExitComplete?.();
    }
  }
</script>

{#if presenceState !== "removed"}
  <div
    bind:this={node}
    class={className}
    data-kind="presence"
    data-slot="root"
    data-state={presenceState}
    data-id={id}
    onanimationend={handleAnimationEnd}
    ontransitionend={handleTransitionEnd}
  >
    {@render children?.({ state: presenceState })}
  </div>
{/if}
