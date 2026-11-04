<!--
  @file Browse & Search Models
  @route /model-loader/browse
  @domain models

  Find Models: local models grouped by role with color, the HuggingFace search
  tab, and the slot popup. The domain's SearchBrowseStep owns all of it.
-->
<script lang="ts">
import { goto } from "$app/navigation";
import { SearchBrowseStep } from "$lib/domains/app/models/index.js";
import { hrefOf, routeAt } from "$lib/sys/routing/index.js";

const models = routeAt("/model-loader/models");

function back(): void {
	if (models) void goto(hrefOf(models));
}
</script>

<SearchBrowseStep onBack={back} onDone={back} />
