<!--
  @file Test Chat
  @route /model-loader/activate
  @domain models

  Verify the brain responds, and run the voice pipeline test (ValidateView, which
  absorbed Step6Activate, ClyfActivationStep and FullPipelineTest).
-->
<script lang="ts">
import { goto } from "$app/navigation";
import { SetupWizard, setupWizardOverlayState } from "$lib/domains/app/models/index.js";
import { hrefOf, routeAt } from "$lib/sys/routing/index.js";

const browse = routeAt("/model-loader/browse");

setupWizardOverlayState.showValidate();
</script>

<SetupWizard checkOnOpen={false} onPickDifferent={() => browse && goto(hrefOf(browse))} />
