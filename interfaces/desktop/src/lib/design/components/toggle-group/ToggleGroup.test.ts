import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import ToggleGroup from "./ToggleGroup.svelte";

describe("toggle-group component — contract", () => {
	test("contract.kind is 'toggle-group'", () => {
		expect(contract.kind).toBe("toggle-group");
	});

	test("contract requires root slot", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract declares group role for root slot", () => {
		expect(contract.slotContracts.root.aria.role).toBe("group");
	});

	test("contract declares button role for item slot", () => {
		expect(contract.slotContracts.item.aria.role).toBe("button");
	});

	test("contract requires aria-pressed on item slot", () => {
		const required = contract.slotContracts.item.aria.required;
		expect(required.some((r) => r.attr === "aria-pressed")).toBe(true);
	});

	test("contract declares selectable interaction", () => {
		expect(contract.interactions.selectable).toBe(true);
	});

	test("contract declares roving-tabindex focus strategy", () => {
		expect(contract.focus.strategy).toBe("roving-tabindex");
	});
});

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

describe("toggle-group component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { container } = render(ToggleGroup, {
			items: [{ value: "a", label: "A" }],
		});
		const root = container.querySelector("[data-kind='toggle-group']");
		expect(root?.className).toContain("inline-flex");
		expect(root?.className).toContain("rounded-md");
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
