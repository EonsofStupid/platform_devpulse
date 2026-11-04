/**
 * @file NotesToggle.test.ts
 * @module @devpulse/domains/chat/ui/notes-toggle
 * You can always see whether this conversation gets your notes, and change it.
 */
import "@devpulse/coldlight/index.css";
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import type { AgentChatCopy } from "$lib/sys/generated/bindings.js";
import NotesToggle from "./NotesToggle.svelte";

const copy = {
	notes_label: "Send my notes",
	notes_yes: "Notes: yes",
	notes_no: "Notes: no",
	notes_help: "What this does",
	notes_change: "Choose which notes",
	notes_failed: "Your choice wasn't saved: {reason}",
} as AgentChatCopy;

function setup(notes: boolean, overrides: { disabled?: boolean; problem?: string } = {}) {
	const onChange = vi.fn();
	const onChoose = vi.fn();
	const screen = render(NotesToggle, {
		copy,
		notes,
		disabled: overrides.disabled ?? false,
		problem: overrides.problem ?? null,
		onChange,
		onChoose,
	});
	return { screen, onChange, onChoose };
}

test("a conversation with notes says yes, and its switch is on", async () => {
	const { screen } = setup(true);
	await expect.element(screen.getByText("Notes: yes")).toBeVisible();
	await expect.element(screen.getByRole("switch", { name: "Send my notes" })).toBeChecked();
});

test("a conversation without notes says no, and its switch is off", async () => {
	const { screen } = setup(false);
	await expect.element(screen.getByText("Notes: no")).toBeVisible();
	await expect.element(screen.getByRole("switch", { name: "Send my notes" })).not.toBeChecked();
});

test("the switch asks for the opposite of what it shows", async () => {
	const { screen, onChange } = setup(true);
	await screen.getByRole("switch", { name: "Send my notes" }).click();
	expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
});

test("it leads to the page that chooses the notes", async () => {
	const { screen, onChoose } = setup(true);
	await screen.getByRole("button", { name: "Choose which notes" }).click();
	expect(onChoose).toHaveBeenCalledOnce();
});

test("while a turn runs the switch cannot change it", async () => {
	const { screen } = setup(true, { disabled: true });
	await expect.element(screen.getByRole("switch", { name: "Send my notes" })).toBeDisabled();
});

test("a refused change says why", async () => {
	const { screen } = setup(true, { problem: "the agent is still answering" });
	await expect
		.element(screen.getByText("Your choice wasn't saved: the agent is still answering"))
		.toBeVisible();
});
