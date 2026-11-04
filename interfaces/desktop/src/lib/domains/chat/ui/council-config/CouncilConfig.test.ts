/**
 * @file CouncilConfig.test.ts
 * @module @devpulse/domains/chat/ui/council-config
 * Every seat says what it can do and whether it gets your notes, and you can change it.
 */
import "@devpulse/coldlight/index.css";
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import type { AgentChatCopy } from "$lib/sys/generated/bindings.js";
import CouncilConfig from "./CouncilConfig.svelte";
import type { CouncilConfigProps, CouncilSeat } from "./council-config.types.js";

const notesCopy = {
	notes_label: "Send my notes",
	notes_yes: "Notes: yes",
	notes_no: "Notes: no",
	notes_help: "What this does",
	notes_change: "Choose which notes",
	notes_failed: "Not saved: {reason}",
} as AgentChatCopy;

const reviewer: CouncilSeat = {
	id: "answerer-1",
	label: "Code Reviewer",
	role: "code-reviewer@1",
	provider: "claude-code",
	kind: "answerer",
	persona: "",
	notes: true,
	job: "Answers without seeing the others",
	access: "Reads this project, changes nothing",
	costar: [
		{ label: "Objective", text: "Find what is wrong" },
		{ label: "Response", text: "defects" },
	],
};

function setup(seats: CouncilSeat[], overrides: Partial<CouncilConfigProps> = {}) {
	const onChange = vi.fn();
	const onNotes = vi.fn();
	const onSave = vi.fn();
	const onBack = vi.fn();
	const screen = render(CouncilConfig, {
		copy: {
			region: "Seat this room",
			eyebrow: "Seat this room",
			heading: "Council",
			summary: "Everyone answers blind.",
			back: "Back",
			role: "Role",
			role_aria: "{seat}: role",
			agent: "Agent",
			agent_aria: "{seat}: agent",
			choose_agent: "Choose an agent",
			character: "Character",
			character_aria: "{seat}: character",
			no_character: "No character",
			costar_title: "What this seat is told",
			start: "Start this room",
		},
		seats,
		roles: [
			{ id: "code-reviewer@1", label: "Code Reviewer" },
			{ id: "domain-expert@1", label: "Domain Expert" },
		],
		providers: [
			{ id: "claude-code", label: "Claude Code" },
			{ id: "gemini", label: "Gemini", unavailable: "Sign in first" },
		],
		personas: [{ id: "ada", label: "Ada" }],
		notesCopy,
		validation: null,
		onChange,
		onNotes,
		onSave,
		onBack,
		...overrides,
	});
	return { screen, onChange, onNotes, onSave, onBack };
}

test("a seat says what it is for, what it can do, and yes on notes", async () => {
	const { screen } = setup([reviewer]);
	await expect.element(screen.getByText("Answers without seeing the others")).toBeVisible();
	await expect.element(screen.getByText("Reads this project, changes nothing")).toBeVisible();
	await expect.element(screen.getByText("Notes: yes")).toBeVisible();
	await expect.element(screen.getByRole("switch", { name: "Send my notes" })).toBeChecked();
});

test("a seat without notes says no, and the switch reports which seat", async () => {
	const { screen, onNotes } = setup([{ ...reviewer, notes: false }]);
	await expect.element(screen.getByText("Notes: no")).toBeVisible();
	await screen.getByRole("switch", { name: "Send my notes" }).click();
	expect(onNotes).toHaveBeenCalledWith("answerer-1", true);
});

test("changing a role reports which seat and which role", async () => {
	const { screen, onChange } = setup([reviewer]);
	await screen.getByRole("combobox", { name: "Code Reviewer: role" }).click();
	await screen.getByRole("option", { name: "Domain Expert" }).click();
	expect(onChange).toHaveBeenCalledWith("answerer-1", "role", "domain-expert@1");
});

test("an agent that is not ready says why and cannot be chosen", async () => {
	const { screen, onChange } = setup([reviewer]);
	await screen.getByRole("combobox", { name: "Code Reviewer: agent" }).click();
	const gemini = screen.getByRole("option", { name: "Gemini — Sign in first" });
	await expect.element(gemini).toBeVisible();
	await expect.element(gemini).toHaveAttribute("aria-disabled", "true");
	expect(onChange).not.toHaveBeenCalled();
});

test("a seat with one role to take cannot pretend otherwise", async () => {
	const { screen } = setup([
		{ ...reviewer, roleChoices: [{ id: "code-reviewer@1", label: "Code Reviewer" }] },
	]);
	await expect
		.element(screen.getByRole("combobox", { name: "Code Reviewer: role" }))
		.toBeDisabled();
});

test("what stops a seat shows on that seat, and what it is told can be opened", async () => {
	const { screen } = setup([{ ...reviewer, problems: ["needs an agent"] }]);
	await expect.element(screen.getByText("needs an agent")).toBeVisible();
	await screen.getByRole("button", { name: "What this seat is told" }).click();
	await expect.element(screen.getByText("Find what is wrong")).toBeVisible();
	await expect.element(screen.getByText("defects")).toBeVisible();
});

test("a problem holds the start button; without one it starts", async () => {
	const held = setup([reviewer], { validation: "Same vendor" });
	await expect.element(held.screen.getByText("Same vendor")).toBeVisible();
	await expect.element(held.screen.getByRole("button", { name: "Start this room" })).toBeDisabled();
	const free = setup([reviewer]);
	await free.screen.getByRole("button", { name: "Start this room" }).click();
	expect(free.onSave).toHaveBeenCalledOnce();
});
