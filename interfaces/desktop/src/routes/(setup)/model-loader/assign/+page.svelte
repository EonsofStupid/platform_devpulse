<!--
  @file Slot assignment
  @route /model-loader/assign
  @domain models

  The per-capability slot assignment page: the domain's ModelLoaderStep (slot
  assignment on the left, resources on the right). Configure leads to the Model
  Loader, where the voice settings live.
-->
<script lang="ts">
import { goto } from "$app/navigation";
import { ModelLoaderStep, modelsState } from "$lib/domains/app/models/index.js";
import { hrefOf, routeAt } from "$lib/sys/routing/index.js";

const models = routeAt("/model-loader/models");
const activate = routeAt("/model-loader/activate");
const modelLoader = routeAt("/model-loader");

const anyAssigned = $derived(modelsState.userSlots.some((slot) => !!slot.assigned_model_id));

function open(node: ReturnType<typeof routeAt>): void {
	if (node) void goto(hrefOf(node));
}
</script>

<ModelLoaderStep
	onBack={() => open(models)}
	onContinue={() => open(activate)}
	continueEnabled={anyAssigned}
	continueBlockers={[]}
	onConfigure={() => open(modelLoader)}
/>
