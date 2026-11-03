/**
 * @file Subscribes the way a component does, from a real `$effect`, for
 * `hardware.effect.test.ts`. Runes live in `.svelte.ts` modules, so the test's
 * one rune is here.
 */
import { hardwareState } from "./hardware.state.svelte.js";

/** Subscribe from an effect, as the status bar does. Returns the teardown. */
export function subscribeInEffect(reason: string): () => void {
	return $effect.root(() => {
		$effect(() => hardwareState.subscribe(reason));
	});
}
