/**
 * @file YourMemory.test.ts
 * @module @devpulse/domains/app/memory/feature
 * The page's wiring with the real state and real ColdLight components, which
 * the notes UI alone cannot show: it once looped until Svelte stopped the page.
 */
import "@devpulse/coldlight/index.css";
import { beforeEach, expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import type { MemoryCopy, MemoryNote } from "#lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({
	notes: vi.fn(),
	save: vi.fn(),
	setIncluded: vi.fn(),
	sending: vi.fn(),
	remove: vi.fn(),
}));
vi.mock("../data-access/memory.service.js", () => mocks);
vi.mock("#lib/domains/app/projects/index.js", () => ({
	projectsState: {
		ready: true,
		activeProjectId: "alpha",
		projects: [
			{ id: "alpha", name: "Alpha" },
			{ id: "beta", name: "Beta" },
		],
	},
}));

import YourMemory from "./YourMemory.svelte";

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
	remove_confirm: "Delete {name}?",
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

function note(projectId: string | null, label: string): MemoryNote {
	return {
		projectId,
		label,
		body: `${label} body`,
		charLimit: 5000,
		updatedAt: "2026-11-03T00:00:00Z",
		version: 1,
		included: false,
		changedSinceApproved: false,
	};
}

beforeEach(() => {
	mocks.notes.mockReset();
	mocks.save.mockReset();
	mocks.setIncluded.mockReset();
	mocks.sending.mockReset();
	mocks.remove.mockReset();
	mocks.sending.mockResolvedValue({ text: null, leftOut: [], used: 0, limit: 8000 });
	mocks.notes.mockImplementation(async (projectId: string | null) =>
		projectId === null ? [note(null, "your note")] : [note(projectId, `${projectId} note`)],
	);
});

test("the page renders your notes and the active project's, reading each once", async () => {
	const screen = await render(YourMemory, { copy });
	await expect.element(screen.getByText("your note", { exact: true })).toBeVisible();
	await expect.element(screen.getByText("alpha note", { exact: true })).toBeVisible();
	// Give a loop time to show itself: it would keep reading.
	await new Promise((resolve) => setTimeout(resolve, 300));
	expect(mocks.notes.mock.calls.filter(([projectId]) => projectId === null)).toHaveLength(1);
	expect(mocks.notes.mock.calls.filter(([projectId]) => projectId === "alpha")).toHaveLength(1);
});

test("a saved note in the project appears and is written to that project", async () => {
	const screen = await render(YourMemory, { copy });
	await expect.element(screen.getByText("alpha note", { exact: true })).toBeVisible();
	mocks.save.mockResolvedValueOnce({ kind: "saved", note: note("alpha", "new note") });
	mocks.notes.mockImplementation(async (projectId: string | null) =>
		projectId === null ? [note(null, "your note")] : [note("alpha", "new note")],
	);
	const project = screen.getByRole("region", { name: "About a project" });
	await project.getByRole("button", { name: "Add a note" }).click();
	await project.getByLabelText("Name").fill("new note");
	await project.getByLabelText("Note").fill("body");
	await project.getByRole("button", { name: "Save" }).click();
	await expect.element(screen.getByText("new note", { exact: true })).toBeVisible();
	expect(mocks.save).toHaveBeenCalledExactlyOnceWith("alpha", "new note", "body", null, true);
});

test("the page shows what goes to your agents, for the project shown", async () => {
	mocks.sending.mockResolvedValue({
		text: "<devpulse_notes>exact text</devpulse_notes>",
		leftOut: ["too long"],
		used: 120,
		limit: 8000,
	});
	const screen = await render(YourMemory, { copy });
	const panel = screen.getByRole("region", { name: "What your agents get" });
	await expect.element(panel.getByText("120 of 8000 characters.")).toBeVisible();
	await expect.element(panel.getByText("Too long to fit: too long.")).toBeVisible();
	await panel.getByRole("button", { name: "Show the exact text" }).click();
	await expect
		.element(panel.getByText("<devpulse_notes>exact text</devpulse_notes>"))
		.toBeVisible();
	expect(mocks.sending).toHaveBeenCalledWith("alpha");
});

test("when nothing goes, the page says how to include a note", async () => {
	const screen = await render(YourMemory, { copy });
	const panel = screen.getByRole("region", { name: "What your agents get" });
	await expect.element(panel.getByText("Nothing goes automatically yet.")).toBeVisible();
});

test("memory that did not start says so instead of an empty page", async () => {
	mocks.notes.mockRejectedValue(new Error("Memory is not available"));
	const screen = await render(YourMemory, { copy });
	await expect.element(screen.getByText("Memory isn't available")).toBeVisible();
});
