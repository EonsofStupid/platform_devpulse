import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";
import NumberInput from "./NumberInput.svelte";

describe("number-input component — contract", () => {
	test("contract.kind is 'number-input'", () => {
		expect(contract.kind).toBe("number-input");
	});

	test("contract requires root, input, increment, decrement slots", () => {
		expect(contract.slots.required).toContain("root");
		expect(contract.slots.required).toContain("input");
		expect(contract.slots.required).toContain("increment");
		expect(contract.slots.required).toContain("decrement");
	});

	test("contract declares spinbutton role for input slot", () => {
		expect(contract.slotContracts.input.aria.role).toBe("spinbutton");
	});

	test("contract declares editable interaction", () => {
		expect(contract.interactions.editable).toBe(true);
	});
});

describe("number-input component — ARIA", () => {
	test("renders with role='group' on root", async () => {
		const { container } = render(NumberInput, {
			"aria-label": "Quantity",
		});
		const root = container.querySelector("[data-kind='number-input']");
		expect(root).not.toBeNull();
		expect(root?.getAttribute("role")).toBe("group");
	});

	test("renders spinbutton input with aria-valuenow", async () => {
		const { container } = render(NumberInput, {
			value: 5,
			"aria-label": "Quantity",
		});
		const input = container.querySelector("[role='spinbutton']");
		expect(input).not.toBeNull();
		expect(input?.getAttribute("aria-valuenow")).toBe("5");
	});

	test("renders increment and decrement buttons with aria-labels", async () => {
		const { container } = render(NumberInput, {
			"aria-label": "Quantity",
		});
		const buttons = container.querySelectorAll("button");
		const labels = Array.from(buttons).map((b) => b.getAttribute("aria-label"));
		expect(labels).toContain("Increase value");
		expect(labels).toContain("Decrease value");
	});
});

describe("number-input component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { container } = render(NumberInput, {
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='number-input']");
		expect(root?.className).toContain("inline-flex");
		expect(root?.className).toContain("rounded-md");
	});

	test("applies size variant classes", async () => {
		const { container } = render(NumberInput, {
			size: "lg",
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='number-input']");
		expect(root?.className).toContain("h-12");
	});
});
