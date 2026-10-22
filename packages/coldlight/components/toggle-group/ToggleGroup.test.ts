import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import ToggleGroup from "./ToggleGroup.svelte";

describe("toggle-group component — ARIA", () => {
	test("renders with role='group' on root", async () => {
		const { container } = render(ToggleGroup, {
			items: [
				{ value: "a", label: "A" },
				{ value: "b", label: "B" },
			],
		});
		const root = container.querySelector("[data-kind='toggle-group']");
		expect(root).not.toBeNull();
		expect(root?.getAttribute("role")).toBe("group");
	});

	test("renders items with role='button'", async () => {
		const { container } = render(ToggleGroup, {
			items: [
				{ value: "bold", label: "Bold" },
				{ value: "italic", label: "Italic" },
			],
		});
		const items = container.querySelectorAll("[role='button']");
		expect(items.length).toBe(2);
	});

	test("renders aria-pressed on items", async () => {
		const { container } = render(ToggleGroup, {
			items: [
				{ value: "bold", label: "Bold" },
				{ value: "italic", label: "Italic" },
			],
			value: "bold",
		});
		const items = container.querySelectorAll("[role='button']");
		const boldItem = Array.from(items).find((i) => i.textContent === "Bold");
		expect(boldItem?.getAttribute("aria-pressed")).toBe("true");
	});

	test("renders aria-orientation on root", async () => {
		const { container } = render(ToggleGroup, {
			items: [{ value: "a", label: "A" }],
			orientation: "vertical",
		});
		const root = container.querySelector("[data-kind='toggle-group']");
		expect(root?.getAttribute("aria-orientation")).toBe("vertical");
	});

	test("renders data-disabled when disabled", async () => {
		const { container } = render(ToggleGroup, {
			disabled: true,
			items: [{ value: "a", label: "A" }],
		});
		const root = container.querySelector("[data-kind='toggle-group']");
		expect(root?.hasAttribute("data-disabled")).toBe(true);
	});
});

describe("toggle-group component — composition", () => {
	test("applies layout classes; its look comes from the kind's attributes", async () => {
		const { container } = render(ToggleGroup, {
			items: [{ value: "a", label: "A" }],
			surface: "glass",
		});
		const root = container.querySelector("[data-kind='toggle-group']");
		expect(root?.className).toContain("inline-flex");
		expect(root?.getAttribute("data-variant")).toBe("elevated");
		expect(root?.getAttribute("data-surface")).toBe("glass");
		expect(root?.hasAttribute("style")).toBe(false);
	});

	test("applies horizontal orientation classes", async () => {
		const { container } = render(ToggleGroup, {
			items: [{ value: "a", label: "A" }],
			orientation: "horizontal",
		});
		const root = container.querySelector("[data-kind='toggle-group']");
		expect(root?.className).toContain("flex-row");
	});

	test("applies vertical orientation classes", async () => {
		const { container } = render(ToggleGroup, {
			items: [{ value: "a", label: "A" }],
			orientation: "vertical",
		});
		const root = container.querySelector("[data-kind='toggle-group']");
		expect(root?.className).toContain("flex-col");
	});
});
