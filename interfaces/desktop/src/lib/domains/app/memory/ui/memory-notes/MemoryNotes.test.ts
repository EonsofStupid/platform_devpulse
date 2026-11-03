/**
 * @file MemoryNotes.test.ts
 * @module @devpulse/domains/app/memory/ui/memory-notes
 * Browser interactions at the notes presentation/intent boundary.
 */
import "@devpulse/coldlight/index.css";
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import type { MemoryCopy, MemoryNote } from "$lib/sys/generated/bindings.js";
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
};

function note(label: string, body: string, charLimit = 5000): MemoryNote {
	return {
		projectId: null,
		label,
		body,
		charLimit,
		updatedAt: "2026-11-03T00:00:00Z",
		version: 1,
	};
}

function setup(notes: MemoryNote[]) {
	const onSave = vi.fn().mockResolvedValue(true);
	const onRemove = vi.fn().mockResolvedValue(true);
	const screen = render(MemoryNotes, { copy, notes, busy: false, onSave, onRemove });
	return { screen, onSave, onRemove };
}

test("an empty place says so and offers a note", async () => {
	const { screen } = setup([]);
	await expect.element(screen.getByText("Nothing here yet.")).toBeVisible();
	await expect.element(screen.getByRole("button", { name: "Add a note" })).toBeEnabled();
});

test("adding a note sends its trimmed name and its text", async () => {
	const { screen, onSave } = setup([]);
	await screen.getByRole("button", { name: "Add a note" }).click();
	await screen.getByLabelText("Name").fill("  preferences  ");
	await screen.getByLabelText("Note").fill("prefers Rust");
	await screen.getByRole("button", { name: "Save" }).click();
	expect(onSave).toHaveBeenCalledExactlyOnceWith("preferences", "prefers Rust");
	// Saved: the form closes.
	await expect.element(screen.getByRole("button", { name: "Add a note" })).toBeVisible();
});

test("a new note cannot take a name in use, because saving would overwrite that note", async () => {
	const { screen, onSave } = setup([note("preferences", "prefers Rust")]);
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
	const { screen, onSave } = setup([note("preferences", "prefers Rust")]);
	await screen.getByRole("button", { name: "Edit" }).click();
	await expect.element(screen.getByLabelText("Name")).toBeDisabled();
	await expect.element(screen.getByLabelText("Note")).toHaveValue("prefers Rust");
	await screen.getByLabelText("Note").fill("prefers Rust 2024");
	await screen.getByRole("button", { name: "Save" }).click();
	expect(onSave).toHaveBeenCalledExactlyOnceWith("preferences", "prefers Rust 2024");
});

test("a note over its limit cannot be saved, counted in characters", async () => {
	const { screen, onSave } = setup([note("short", "ok", 3)]);
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
	const { screen, onRemove } = setup([note("preferences", "prefers Rust")]);
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
	const onSave = vi.fn().mockResolvedValue(false);
	const onRemove = vi.fn();
	const screen = render(MemoryNotes, { copy, notes: [], busy: false, onSave, onRemove });
	await screen.getByRole("button", { name: "Add a note" }).click();
	await screen.getByLabelText("Name").fill("preferences");
	await screen.getByLabelText("Note").fill("do not lose this");
	await screen.getByRole("button", { name: "Save" }).click();
	expect(onSave).toHaveBeenCalledOnce();
	await expect.element(screen.getByLabelText("Note")).toHaveValue("do not lose this");
});
