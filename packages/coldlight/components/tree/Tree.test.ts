/** @file Restored Tree behavior against the preserved hierarchy and keyboard contract. */
import "../../index.css";
import { expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import Fixture from "./Tree.fixture.svelte";

test("restores named hierarchy with one tab stop and generated visual selectors", async () => {
	const screen = render(Fixture, { props: { surface: "glass", variant: "deep" } });
	await expect
		.element(screen.getByRole("tree", { name: "Workspace" }))
		.toHaveAttribute("data-surface", "glass");
	const source = screen.getByRole("treeitem", { name: "Source", exact: true });
	await expect.element(source).toHaveAttribute("aria-expanded", "false");
	await expect.element(source).toHaveAttribute("tabindex", "0");
	await expect.element(source).toHaveAttribute("data-variant", "deep");
	await expect.element(source).toHaveStyle({ cursor: "pointer" });
	await expect
		.element(screen.getByRole("treeitem", { name: "README.md" }))
		.not.toHaveAttribute("aria-expanded");
	expect(screen.container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
	expect(screen.container.querySelectorAll("[style]")).toHaveLength(0);
});

test("navigates expanded hierarchy; right on a leaf stays put and left returns to parent", async () => {
	const screen = render(Fixture);
	const source = screen.getByRole("treeitem", { name: "Source", exact: true });
	(source.element() as HTMLElement).focus();
	await userEvent.keyboard("{ArrowRight}{ArrowRight}");
	const app = screen.getByRole("treeitem", { name: "App.ts" });
	await expect.element(app).toHaveFocus();
	await userEvent.keyboard("{ArrowRight}");
	await expect.element(app).toHaveFocus();
	await userEvent.keyboard("{ArrowDown}{ArrowRight}{ArrowRight}");
	await expect.element(screen.getByRole("treeitem", { name: "Kernel.rs" })).toHaveFocus();
	await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
	await expect
		.element(screen.getByRole("treeitem", { name: "Nested", exact: true }))
		.toHaveAttribute("aria-expanded", "false");
	await userEvent.keyboard("{ArrowDown}");
	await expect.element(screen.getByRole("treeitem", { name: "README.md" })).toHaveFocus();
	await userEvent.keyboard("{Home}");
	await expect.element(source).toHaveFocus();
	await userEvent.keyboard("{End}");
	await expect.element(screen.getByRole("treeitem", { name: "Tests", exact: true })).toHaveFocus();
	expect(screen.container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
});

test("single selection replaces the previous key without coupling selection to focus", async () => {
	const onSelectionChange = vi.fn();
	const screen = render(Fixture, { props: { selectionMode: "single", onSelectionChange } });
	const source = screen.getByRole("treeitem", { name: "Source", exact: true });
	(source.element() as HTMLElement).focus();
	await userEvent.keyboard(" ");
	await expect.element(source).toHaveAttribute("aria-selected", "true");
	await expect.element(source).toHaveStyle({ fontWeight: "700" });
	await userEvent.keyboard("{ArrowDown}");
	await expect.element(source).toHaveAttribute("aria-selected", "true");
	await userEvent.keyboard(" ");
	await expect.element(source).toHaveAttribute("aria-selected", "false");
	expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["readme"]));
});

test("controlled keys ask their owner and update only after the owner supplies new values", async () => {
	const onExpandedChange = vi.fn();
	const onSelectionChange = vi.fn();
	const screen = render(Fixture, {
		props: {
			expandedKeys: new Set<string>(),
			selectedKeys: new Set<string>(),
			selectionMode: "single",
			onExpandedChange,
			onSelectionChange,
		},
	});
	const source = screen.getByRole("treeitem", { name: "Source", exact: true });
	await source.click();
	expect(onExpandedChange).toHaveBeenCalledWith(new Set(["source"]));
	expect(onSelectionChange).toHaveBeenCalledWith(new Set(["source"]));
	await expect.element(source).toHaveAttribute("aria-expanded", "false");
	await expect.element(source).toHaveAttribute("aria-selected", "false");
	await screen.rerender({ expandedKeys: new Set(["source"]), selectedKeys: new Set(["source"]) });
	await expect.element(source).toHaveAttribute("aria-expanded", "true");
	await expect.element(source).toHaveAttribute("aria-selected", "true");
});

test("a child click never toggles or activates its ancestors", async () => {
	const onAction = vi.fn();
	const screen = render(Fixture, { props: { defaultExpandedKeys: new Set(["source"]), onAction } });
	await screen.getByRole("treeitem", { name: "App.ts" }).click();
	expect(onAction).toHaveBeenCalledExactlyOnceWith("app");
	await expect
		.element(screen.getByRole("treeitem", { name: "Source", exact: true }))
		.toHaveAttribute("aria-expanded", "true");
});

test("multiple selection toggles independent keys; none mode never exposes selection", async () => {
	const screen = render(Fixture, { props: { selectionMode: "multiple" } });
	await expect.element(screen.getByRole("tree")).toHaveAttribute("aria-multiselectable", "true");
	const source = screen.getByRole("treeitem", { name: "Source", exact: true });
	(source.element() as HTMLElement).focus();
	await userEvent.keyboard(" {ArrowDown} ");
	await expect.element(source).toHaveAttribute("aria-selected", "true");
	await expect
		.element(screen.getByRole("treeitem", { name: "README.md" }))
		.toHaveAttribute("aria-selected", "true");
	await screen.rerender({ selectionMode: "none" });
	await expect.element(source).not.toHaveAttribute("aria-selected");
});

test("disabled items and a disabled tree cannot activate or change state", async () => {
	const onAction = vi.fn();
	const screen = render(Fixture, { props: { defaultExpandedKeys: new Set(["source"]), onAction } });
	await screen.getByRole("treeitem", { name: "Unavailable" }).click({ force: true });
	expect(onAction).not.toHaveBeenCalled();
	await screen.rerender({ disabled: true });
	const source = screen.getByRole("treeitem", { name: "Source", exact: true });
	(source.element() as HTMLElement).focus();
	await userEvent.keyboard("{ArrowLeft}{Enter} ");
	await source.click({ force: true });
	expect(onAction).not.toHaveBeenCalled();
	await expect.element(source).toHaveAttribute("aria-expanded", "true");
	expect(screen.container.querySelectorAll('[tabindex="0"]')).toHaveLength(0);
});

test("custom root ids retain navigation, typeahead and Enter activation", async () => {
	const onAction = vi.fn();
	const screen = render(Fixture, { props: { id: "project-tree", onAction } });
	(screen.getByRole("treeitem", { name: "Source", exact: true }).element() as HTMLElement).focus();
	await userEvent.keyboard("r{Enter}");
	await expect.element(screen.getByRole("treeitem", { name: "README.md" })).toHaveFocus();
	expect(onAction).toHaveBeenCalledExactlyOnceWith("readme");
});
