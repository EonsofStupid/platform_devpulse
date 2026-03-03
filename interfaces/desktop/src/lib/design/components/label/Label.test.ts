import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";
import { Label } from "./index.js";

describe("label component — contract", () => {
	test("contract.kind is 'label'", () => {
		expect(contract.kind).toBe("label");
	});

	test("contract requires root slot", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract declares label element for root slot", () => {
		expect(contract.slotContracts.root.element).toBe("label");
	});

	test("contract declares no modal interaction", () => {
		expect(contract.interactions.modal).toBe(false);
	});
});

describe("label component — ARIA", () => {
	test("renders a <label> element", async () => {
		const { container } = render(Label);
		const label = container.querySelector("label");
		expect(label).not.toBeNull();
	});

	test("renders data-kind='label' and data-slot='root'", async () => {
		const { container } = render(Label);
		const label = container.querySelector("[data-kind='label']");
		expect(label).not.toBeNull();
		expect(label?.getAttribute("data-slot")).toBe("root");
	});

	test("renders for attribute from htmlFor prop", async () => {
		const { container } = render(Label, {
			htmlFor: "email-input",
		});
		const label = container.querySelector("label");
		expect(label?.getAttribute("for")).toBe("email-input");
	});

	test("renders data-disabled when disabled", async () => {
		const { container } = render(Label, {
			disabled: true,
		});
		const label = container.querySelector("label");
		expect(label?.hasAttribute("data-disabled")).toBe(true);
	});
});

describe("label component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { container } = render(Label);
		const label = container.querySelector("label");
		expect(label?.className).toContain("font-medium");
	});

	test("applies size variant classes", async () => {
		const { container } = render(Label, {
			size: "lg",
		});
		const label = container.querySelector("label");
		expect(label?.className).toContain("text-base");
	});

	test("applies sm size variant", async () => {
		const { container } = render(Label, {
			size: "sm",
		});
		const label = container.querySelector("label");
		expect(label?.className).toContain("text-xs");
	});
});
