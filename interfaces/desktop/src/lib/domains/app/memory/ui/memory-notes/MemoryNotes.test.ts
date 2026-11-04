/**
 * @file MemoryNotes.test.ts
 * @module @devpulse/domains/app/memory/ui/memory-notes
 * Browser interactions at the notes presentation/intent boundary.
 */
import "@devpulse/coldlight/index.css";
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import type { MemoryCopy, MemoryNote } from "#lib/sys/generated/bindings.js";
import MemoryNotes from "./MemoryNotes.svelte";

const copy: MemoryCopy = {
	subtitle: "Short notes",
	yours_title: "About you",
	yours_description: "Every agent can read these",
	project_title: "About a project",
	project_description: "Agents in this project",
	project_label: "Project",
	no_projects: "Add a project",
	unavailable: "Memory isn't available",
	empty: "Nothing here yet.",
	add: "Add a note",
	name: "Name",
	name_hint: "A short name",
	name_taken: "You already have a note named {name}.",
	body: "Note",
	characters: "{used} of {limit} characters",
	save: "Save",
	cancel: "Cancel",
	edit: "Edit",
	remove: "Delete",
	remove_confirm: "Delete {name}? This can't be undone.",
	remove_yes: "Delete it",
	keep: "Keep it",
	include_label: "Send with every conversation",
	changed_by_agent: "An agent changed this note.",
	include_moved: "This note changed before your choice was saved.",
	save_moved: "An agent changed this note while you were editing.",
	save_gone: "This note was deleted while you were editing.",
	current_title: "What it says now",
	sending_title: "What your agents get",
	sending_description: "This goes with every new conversation.",
	sending_none: "Nothing goes automatically yet.",
	sending_used: "{used} of {limit} characters.",
	sending_left_out: "Too long to fit: {names}.",
	sending_show: "Show the exact text",
	sending_hide: "Hide the exact text",
};

function note(label: string, body: string, charLimit = 5000): MemoryNote {
	return {
		projectId: null,
		label,
		body,
		charLimit,
		updatedAt: "2026-11-03T00:00:00Z",
		version: 1,
		included: false,
		changedSinceApproved: false,
	};
}

async function setup(notes: MemoryNote[]) {
	const onSave = vi.fn().mockResolvedValue({ kind: "saved", note: note("saved", "saved") });
	const onInclude = vi.fn().mockResolvedValue({ kind: "saved", note: note("saved", "saved") });
	const onRemove = vi.fn().mockResolvedValue(true);
	const screen = await render(MemoryNotes, {
		copy,
		notes,
		busy: false,
		onSave,
		onInclude,
		onRemove,
	});
	return { screen, onSave, onInclude, onRemove };
}

const INCLUDE = { name: "Send with every conversation" };

test("an empty place says so and offers a note", async () => {
	const { screen } = await setup([]);
	await expect.element(screen.getByText("Nothing here yet.")).toBeVisible();
	await expect.element(screen.getByRole("button", { name: "Add a note" })).toBeEnabled();
});

test("adding a note sends its trimmed name and its text", async () => {
	const { screen, onSave } = await setup([]);
	await screen.getByRole("button", { name: "Add a note" }).click();
	await screen.getByLabelText("Name").fill("  preferences  ");
	await screen.getByLabelText("Note").fill("prefers Rust");
	await screen.getByRole("button", { name: "Save" }).click();
	// A new note expects nothing there, and goes with every conversation unless you say not.
	expect(onSave).toHaveBeenCalledExactlyOnceWith("preferences", "prefers Rust", null, true);
	// Saved: the form closes.
	await expect.element(screen.getByRole("button", { name: "Add a note" })).toBeVisible();
});

test("a new note cannot take a name in use, because saving would overwrite that note", async () => {
	const { screen, onSave } = await setup([note("preferences", "prefers Rust")]);
	await screen.getByRole("button", { name: "Add a note" }).click();
	await screen.getByLabelText("Name").fill("preferences");
	await screen.getByLabelText("Note").fill("something else");
	await expect
		.element(screen.getByText("You already have a note named preferences."))
		.toBeVisible();
	await expect.element(screen.getByRole("button", { name: "Save" })).toBeDisabled();
	expect(onSave).not.toHaveBeenCalled();
});

test("editing keeps the note's name and sends the new text", async () => {
	const { screen, onSave } = await setup([note("preferences", "prefers Rust")]);
	await screen.getByRole("button", { name: "Edit" }).click();
	await expect.element(screen.getByLabelText("Name")).toBeDisabled();
	await expect.element(screen.getByLabelText("Note")).toHaveValue("prefers Rust");
	await screen.getByLabelText("Note").fill("prefers Rust 2024");
	await screen.getByRole("button", { name: "Save" }).click();
	expect(onSave).toHaveBeenCalledExactlyOnceWith("preferences", "prefers Rust 2024", 1, false);
});

test("a new note can be kept back from every conversation", async () => {
	const { screen, onSave } = await setup([]);
	await screen.getByRole("button", { name: "Add a note" }).click();
	await screen.getByLabelText("Name").fill("private");
	await screen.getByRole("switch", INCLUDE).click();
	await screen.getByRole("button", { name: "Save" }).click();
	expect(onSave).toHaveBeenCalledExactlyOnceWith("private", "", null, false);
});

test("a note's switch shows its state and sends the version you are reading", async () => {
	const { screen, onInclude } = await setup([
		{ ...note("stack", "Tauri"), version: 4, included: true },
	]);
	const toggle = screen.getByRole("switch", INCLUDE);
	await expect.element(toggle).toBeChecked();
	await toggle.click();
	expect(onInclude).toHaveBeenCalledExactlyOnceWith("stack", 4, false);
});

test("a note an agent changed says so, and its switch is off", async () => {
	const { screen } = await setup([{ ...note("stack", "Agent text"), changedSinceApproved: true }]);
	await expect.element(screen.getByText("An agent changed this note.")).toBeVisible();
	await expect.element(screen.getByRole("switch", INCLUDE)).not.toBeChecked();
});

test("turning on a note that has since changed says nothing changed", async () => {
	const { screen, onInclude } = await setup([note("stack", "What you read")]);
	onInclude.mockResolvedValueOnce({ kind: "changed", current: note("stack", "Newer") });
	await screen.getByRole("switch", INCLUDE).click();
	await expect
		.element(screen.getByText("This note changed before your choice was saved."))
		.toBeVisible();
});

test("a save that came too late keeps your text, shows the note's, and saving again replaces it", async () => {
	const { screen, onSave } = await setup([note("stack", "What you read")]);
	const newer = { ...note("stack", "The agent's newer text"), version: 2 };
	onSave.mockResolvedValueOnce({ kind: "changed", current: newer });
	await screen.getByRole("button", { name: "Edit" }).click();
	await screen.getByLabelText("Note").fill("What you typed");
	await screen.getByRole("button", { name: "Save" }).click();

	await expect
		.element(screen.getByText("An agent changed this note while you were editing."))
		.toBeVisible();
	await expect.element(screen.getByText("The agent's newer text")).toBeVisible();
	await expect.element(screen.getByLabelText("Note")).toHaveValue("What you typed");

	await screen.getByRole("button", { name: "Save" }).click();
	expect(onSave).toHaveBeenLastCalledWith("stack", "What you typed", 2, false);
	await expect.element(screen.getByRole("button", { name: "Add a note" })).toBeVisible();
});

test("a note deleted while you edited says so, and saving again creates it", async () => {
	const { screen, onSave } = await setup([note("stack", "What you read")]);
	onSave.mockResolvedValueOnce({ kind: "changed", current: null });
	await screen.getByRole("button", { name: "Edit" }).click();
	await screen.getByRole("button", { name: "Save" }).click();
	await expect
		.element(screen.getByText("This note was deleted while you were editing."))
		.toBeVisible();
	await screen.getByRole("button", { name: "Save" }).click();
	expect(onSave).toHaveBeenLastCalledWith("stack", "What you read", null, false);
});

test("a note over its limit cannot be saved, counted in characters", async () => {
	const { screen, onSave } = await setup([note("short", "ok", 3)]);
	await screen.getByRole("button", { name: "Edit" }).click();
	await screen.getByLabelText("Note").fill("🦀🦀🦀");
	await expect.element(screen.getByText("3 of 3 characters")).toBeVisible();
	await expect.element(screen.getByRole("button", { name: "Save" })).toBeEnabled();
	await screen.getByLabelText("Note").fill("🦀🦀🦀🦀");
	await expect.element(screen.getByText("4 of 3 characters")).toBeVisible();
	await expect.element(screen.getByRole("button", { name: "Save" })).toBeDisabled();
	expect(onSave).not.toHaveBeenCalled();
});

test("deleting says what it does first, and keeping it does nothing", async () => {
	const { screen, onRemove } = await setup([note("preferences", "prefers Rust")]);
	await screen.getByRole("button", { name: "Delete", exact: true }).click();
	await expect.element(screen.getByText("Delete preferences? This can't be undone.")).toBeVisible();
	expect(onRemove).not.toHaveBeenCalled();

	await screen.getByRole("button", { name: "Keep it" }).click();
	expect(onRemove).not.toHaveBeenCalled();

	await screen.getByRole("button", { name: "Delete", exact: true }).click();
	await screen.getByRole("button", { name: "Delete it" }).click();
	expect(onRemove).toHaveBeenCalledExactlyOnceWith("preferences");
});

test("a refused save keeps what you wrote", async () => {
	const onSave = vi.fn().mockResolvedValue(null);
	const onInclude = vi.fn();
	const onRemove = vi.fn();
	const screen = await render(MemoryNotes, {
		copy,
		notes: [],
		busy: false,
		onSave,
		onInclude,
		onRemove,
	});
	await screen.getByRole("button", { name: "Add a note" }).click();
	await screen.getByLabelText("Name").fill("preferences");
	await screen.getByLabelText("Note").fill("do not lose this");
	await screen.getByRole("button", { name: "Save" }).click();
	expect(onSave).toHaveBeenCalledOnce();
	await expect.element(screen.getByLabelText("Note")).toHaveValue("do not lose this");
});
