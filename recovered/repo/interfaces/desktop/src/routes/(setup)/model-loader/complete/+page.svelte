<script lang="ts">
import { goto } from "$app/navigation";
import { CompletionStep } from "$lib/domains/app/models/features/setup-wizard/index.js";

function handleComplete(): void {
	void goto("/devpulse", { replaceState: true, noScroll: true });
}
</script>

<CompletionStep onComplete={handleComplete} />
