import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import ColorInput from "./ColorInput.svelte";
import { contract } from "./contract.js";

describe("color-input component — contract", () => {
	test("contract.kind is 'color-input'", () => {
		expect(contract.kind).toBe("color-input");
	});

	test("contract requires root and input slots", () => {
		expect(contract.slots.required).toContain("root");
		expect(contract.slots.required).toContain("input");
	});

	test("contract declares group role for root slot", () => {
		expect(contract.slotContracts.root.aria.role).toBe("group");
	});

	test("contract declares presentation role for swatch slot", () => {
		expect(contract.slotContracts.swatch.aria.role).toBe("presentation");
	});

	test("contract declares selectable interaction", () => {
		expect(contract.interactions.selectable).toBe(true);
	});
});

describe("color-input component — ARIA", () => {
	test("renders with role='group' on root", async () => {
		const { container } = render(ColorInput, {
			"aria-label": "Pick color",
		});
		const root = container.querySelector("[data-kind='color-input']");
		expect(root).not.toBeNull();
		expect(root?.getAttribute("role")).toBe("group");
	});

	test("renders native color input", async () => {
		const { container } = render(ColorInput, {
			"aria-label": "Pick color",
		});
		const input = container.querySelector("input[type='color']");
		expect(input).not.toBeNull();
	});

	test("renders swatch with aria-hidden", async () => {
		const { container } = render(ColorInput, {
			"aria-label": "Pick color",
		});
		const swatch = container.querySelector("[role='presentation']");
		expect(swatch).not.toBeNull();
		expect(swatch?.getAttribute("aria-hidden")).toBe("true");
	});

	test("renders label when label prop provided", async () => {
		const { container } = render(ColorInput, {
			label: "Background Color",
			"aria-label": "Pick color",
		});
		const label = container.querySelector("label");
		expect(label).not.toBeNull();
		expect(label?.textContent).toBe("Background Color");
	});
});

describe("color-input component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { container } = render(ColorInput, {
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='color-input']");
		expect(root?.className).toContain("inline-flex");
		expect(root?.className).toContain("rounded-md");
	});

	test("applies size variant classes", async () => {
		const { container } = render(ColorInput, {
			size: "lg",
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='color-input']");
		expect(root?.className).toContain("h-12");
	});
});
