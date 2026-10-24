<script lang="ts">
import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import { page } from "$app/state";
import { onboardingState } from "$lib/domains/app/onboarding/index.js";
import Frame from "$lib/layouts/app/Frame.svelte";

let { children } = $props();

const onboardingHref = resolve("/onboarding");

// First run is Rust's state; while it is open, it is what shows.
$effect(() => onboardingState.start());
$effect(() => {
	if (onboardingState.isOpen && page.url.pathname !== onboardingHref) {
		void goto(onboardingHref, { replaceState: true });
	}
});

// The Visual Page Builder is a dev tool (Ctrl+Shift+B). Its import sits
// behind `import.meta.env.DEV`, which Vite replaces with `false` in a
// production build, so the build drops it.
const vpb = import.meta.env.DEV ? import("$lib/sys/debug/vpb/index.js") : null;
let vpbOpen = $state(false);

function onKeydown(e: KeyboardEvent) {
	if (vpb && e.ctrlKey && e.shiftKey && e.key === "B") {
		e.preventDefault();
		vpbOpen = !vpbOpen;
	}
}
</script>

<svelte:window onkeydown={onKeydown} />

<Frame>
	{@render children()}
</Frame>

{#if vpb}
	{#await vpb then { Vpb }}
		<Vpb bind:open={vpbOpen} />
	{/await}
{/if}
