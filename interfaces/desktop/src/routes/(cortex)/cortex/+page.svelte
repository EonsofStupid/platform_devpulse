<!--
	@file Cortex — Clyffy's five pieces on one screen
	@route /cortex
	@domain models

	Mounts the setup wizard (restored from e0b576ff^) on its cortex view:
	Eyes, Ears, Mouth, Sparkles and Brain as anatomy tiles, each with its
	recommended model and its own Apply. Done marks setup complete and
	returns to the Model Loader; Skip goes to the Slot Orchestrator.
	Replaces the "Cortex Viewer" placeholder (master plan R3).
-->
<script lang="ts">
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { SetupWizardOverlay, wizardState } from "$lib/domains/app/models/index.js";
import { hrefOf, routeAt } from "$lib/sys/routing/index.js";

const modelLoader = routeAt("/model-loader");
let opened = $state(false);

onMount(() => {
	wizardState.goTo("cortex");
	wizardState.open();
	opened = true;
	return () => wizardState.close();
});

// Done closes the wizard; this page has nothing else to show.
$effect(() => {
	if (opened && !wizardState.isOpen && modelLoader) {
		void goto(hrefOf(modelLoader), { replaceState: true });
	}
});
</script>

<SetupWizardOverlay />
