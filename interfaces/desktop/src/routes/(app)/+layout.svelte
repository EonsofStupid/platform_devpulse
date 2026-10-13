<script lang="ts">
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { onboardingState } from "$lib/domains/app/onboarding/index.js";
import Frame from "$lib/layouts/app/Frame.svelte";

let { children } = $props();

// First run is Rust's state; while it is open, it is what shows.
$effect(() => onboardingState.start());
$effect(() => {
	if (onboardingState.isOpen && page.url.pathname !== "/onboarding") {
		void goto("/onboarding", { replaceState: true });
	}
});
</script>

<Frame>
	{@render children()}
</Frame>
