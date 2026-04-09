<!--
  @file Model Loader Layout
  @route (setup)/model-loader

  Bare full-screen shell for the setup wizard.
  Background image only. No Frame, no sidebar, no nav, no progress dots.
  SetupWizard.svelte owns all wizard chrome (progress dots, navigation, phase switching).
  This layout just provides the full-screen container + background.
-->
<script lang="ts">
let { children }: { children: import("svelte").Snippet } = $props();
</script>

<div class="wizard-layout">
	<img
		src="/imgs/backgrounds/maincontentbackground.png"
		alt=""
		class="wizard-bg"
		aria-hidden="true"
	/>
	<main class="wizard-main">
		{@render children()}
	</main>
</div>

<style>
	.wizard-layout {
		width: 100%; height: 100vh; position: relative; overflow: hidden;
		background: var(--surface-base);
		color: var(--text-primary);
	}
	.wizard-bg {
		position: absolute; inset: 0; width: 100%; height: 100%;
		object-fit: cover; object-position: center top;
		opacity: clamp(0.08, 0.15, 0.2);
		pointer-events: none; z-index: 0;
		mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
		-webkit-mask-image: linear-gradient(to bottom, black 0%, black 60%, transparent 100%);
	}
	.wizard-main {
		position: relative; z-index: 1;
		width: 100%; height: 100%;
		display: flex; flex-direction: column; align-items: center;
		overflow-y: auto;
	}
</style>
