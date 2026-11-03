/**
 * @file switch-layout.test.ts
 * @module @devpulse/domains/app/memory/ui/memory-notes
 * A note's switch has to show which way it is set. Where its thumb lands is
 * Tailwind, so this runs on the app's own stylesheet, which compiles it.
 */
import "../../../../../../app.css";
import { Switch, type SwitchSize } from "@devpulse/coldlight/components/switch";
import { expect, test } from "vitest";
import { render } from "vitest-browser-svelte";

function drawn(checked: boolean, size: SwitchSize) {
	const screen = render(Switch, { checked, size, "aria-label": "Setting" });
	const track = screen.container.querySelector('[role="switch"]') as HTMLElement;
	const thumb = track.querySelector('[data-slot="thumb"]') as HTMLElement;
	return { track, thumb };
}

/** Wait out the thumb's slide, so this reads where it lands. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 300));

for (const size of ["sm", "md", "lg"] as const) {
	test(`at ${size}, the thumb starts at one end and slides to the other, inside the track`, async () => {
		const off = drawn(false, size);
		const on = drawn(true, size);
		await settled();

		const leftGap = off.thumb.getBoundingClientRect().left - off.track.getBoundingClientRect().left;
		const rightGap =
			on.track.getBoundingClientRect().right - on.thumb.getBoundingClientRect().right;
		expect(leftGap).toBeGreaterThanOrEqual(0);
		expect(rightGap).toBeGreaterThanOrEqual(0);
		// Set evenly: it sits as far from the far end when on as from the near end when off.
		expect(Math.abs(rightGap - leftGap)).toBeLessThanOrEqual(1);
		expect(leftGap).toBeLessThanOrEqual(4);
	});
}
