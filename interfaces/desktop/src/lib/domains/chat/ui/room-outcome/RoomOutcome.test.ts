/**
 * @file RoomOutcome.test.ts
 * @module @devpulse/domains/chat/ui/room-outcome
 * How a room ended reads plainly, whichever way it ended.
 */
import "@devpulse/coldlight/index.css";
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import type { Outcome, RoomChatCopy } from "#lib/sys/generated/bindings.js";
import RoomOutcome from "./RoomOutcome.svelte";

const copy = {
	outcome_title: "How it ended",
	stopped_rounds: "Finished after {rounds} rounds.",
	stopped_stable: "Stopped after {rounds} rounds: a round added nothing new.",
	stopped_passed: "Stopped after {rounds} rounds: nothing left to fix.",
	picked: "Picked: {place}",
	runner_up: "Next best: {place}",
	no_pick: "Nothing was picked: {reason}",
	tie: "No clear winner.",
	reasons: "Why",
	dissent: "Against it",
	flips: "Changed their mind",
	routed: "Sent to {place}",
	escalated: "This needed a Council.",
	open_council: "Open the Council",
	failed: "The room did not finish: {reason}",
} as RoomChatCopy;

const pick = {
	winner: "A",
	winnerPlace: "answerer-1",
	runnerUp: "B",
	tie: false,
	rationale: ["It read the file"],
	dissent: ["It said little else"],
	problem: null,
};
const outcome = (change: Partial<Outcome>): Outcome => ({
	rounds: 1,
	stopped: "rounds",
	pick: null,
	flips: [],
	route: null,
	...change,
});
const placeLabel = (place: string) => `Label of ${place}`;

test("a pick says who, by the name you know them by, and why", async () => {
	const screen = await render(RoomOutcome, { copy, outcome: outcome({ pick }), placeLabel });
	await expect.element(screen.getByText("Finished after 1 rounds.")).toBeVisible();
	await expect.element(screen.getByText("Picked: Label of answerer-1")).toBeVisible();
	await expect.element(screen.getByText("Next best: B")).toBeVisible();
	await expect.element(screen.getByText("It read the file")).toBeVisible();
	await expect.element(screen.getByText("It said little else")).toBeVisible();
});

test("no pick says why, and a tie says so", async () => {
	const none = { ...pick, winner: null, winnerPlace: null, problem: "no candidate answered" };
	const first = await render(RoomOutcome, { copy, outcome: outcome({ pick: none }), placeLabel });
	await expect.element(first.getByText("Nothing was picked: no candidate answered")).toBeVisible();
	const second = await render(RoomOutcome, {
		copy,
		outcome: outcome({ pick: { ...pick, tie: true } }),
		placeLabel,
	});
	await expect.element(second.getByText("No clear winner.")).toBeVisible();
});

test("it says why a room stopped early", async () => {
	const stable = await render(RoomOutcome, {
		copy,
		outcome: outcome({ stopped: "stable", rounds: 2 }),
		placeLabel,
	});
	await expect
		.element(stable.getByText("Stopped after 2 rounds: a round added nothing new."))
		.toBeVisible();
});

test("a route says where it went, and a Council can be opened", async () => {
	const route = { place: "hardware-1", rationale: "It fits", escalate: false, problem: null };
	const routed = await render(RoomOutcome, { copy, outcome: outcome({ route }), placeLabel });
	await expect.element(routed.getByText("Sent to Label of hardware-1")).toBeVisible();
	await expect.element(routed.getByText("It fits")).toBeVisible();

	const onOpenCouncil = vi.fn();
	const escalated = await render(RoomOutcome, {
		copy,
		outcome: outcome({ route: { ...route, place: null, escalate: true } }),
		placeLabel,
		onOpenCouncil,
	});
	await escalated.getByRole("button", { name: "Open the Council" }).click();
	expect(onOpenCouncil).toHaveBeenCalledOnce();
});
