/**
 * @file components/avatar/Avatar.test.ts
 * @kind avatar
 * @layer components
 * @package @devpulse/coldlight
 *
 * Avatar component browser tests.
 * Tests ARIA application, data-state derivation, recipe class application,
 * image load state management, fallback rendering, and prop forwarding.
 *
 * Runner: Vitest browser mode (Chromium via Playwright)
 * Setup:  vitest-browser-svelte
 */

import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import { Avatar } from "$lib/design/ui/avatar/index.js";
import { contract } from "./contract.js";

// =============================================================================
// CONTRACT INTEGRITY
// =============================================================================

describe("avatar component — contract", () => {
	test("contract.kind is 'avatar'", () => {
		expect(contract.kind).toBe("avatar");
	});

	test("contract.primitiveKind is 'avatar'", () => {
		expect(contract.primitiveKind).toBe("avatar");
	});

	test("contract requires slot 'root'", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract has optional slots 'image' and 'fallback'", () => {
		expect(contract.slots.optional).toContain("image");
		expect(contract.slots.optional).toContain("fallback");
	});

	test("contract focus strategy is 'none'", () => {
		expect(contract.focus.strategy).toBe("none");
	});
});

// =============================================================================
// STRUCTURAL ATTRIBUTES — data-kind, data-slot
// =============================================================================

describe("avatar component — structural attributes", () => {
	test("renders a <span> element with role='img'", async () => {
		const { getByRole } = render(Avatar, { props: { alt: "User avatar" } });
		const avatar = getByRole("img");
		expect(avatar).toBeTruthy();
	});

	test("has data-kind='avatar'", async () => {
		const { getByRole } = render(Avatar, { props: { alt: "User avatar" } });
		const avatar = getByRole("img");
		await expect.element(avatar).toHaveAttribute("data-kind", "avatar");
	});

	test("has data-slot='root'", async () => {
		const { getByRole } = render(Avatar, { props: { alt: "User avatar" } });
		const avatar = getByRole("img");
		await expect.element(avatar).toHaveAttribute("data-slot", "root");
	});
});

// =============================================================================
// ARIA ATTRIBUTES — component layer owns ARIA
// =============================================================================

describe("avatar component — ARIA attributes", () => {
	test("has role='img'", async () => {
		const { getByRole } = render(Avatar, { props: { alt: "User avatar" } });
		const avatar = getByRole("img");
		await expect.element(avatar).toHaveAttribute("role", "img");
	});

	test("has aria-label set from alt prop", async () => {
		const { getByRole } = render(Avatar, { props: { alt: "Jane Doe" } });
		const avatar = getByRole("img");
		await expect.element(avatar).toHaveAttribute("aria-label", "Jane Doe");
	});

	test("image element has aria-hidden='true'", async () => {
		const { container } = render(Avatar, {
			props: { src: "https://example.com/avatar.png", alt: "User" },
		});
		const img = container.querySelector("img") as HTMLElement | null;
		expect(img).toBeTruthy();
		await expect.element(img!).toHaveAttribute("aria-hidden", "true");
	});
});

// =============================================================================
// DATA-STATE — image load state
// =============================================================================

describe("avatar component — data-state", () => {
	test("data-state='error' when no src is provided", async () => {
		const { getByRole } = render(Avatar, { props: { alt: "User", fallback: "JD" } });
		const avatar = getByRole("img");
		await expect.element(avatar).toHaveAttribute("data-state", "error");
	});

	test("data-state='loading' when src is provided (before load)", async () => {
		const { getByRole } = render(Avatar, {
			props: { src: "https://example.com/avatar.png", alt: "User" },
		});
		const avatar = getByRole("img");
		await expect.element(avatar).toHaveAttribute("data-state", "loading");
	});
});

// =============================================================================
// FALLBACK RENDERING
// =============================================================================

describe("avatar component — fallback", () => {
	test("shows fallback text when no src is provided", async () => {
		const { container } = render(Avatar, {
			props: { alt: "Jane Doe", fallback: "JD" },
		});
		const fallbackEl = container.querySelector("[data-slot='fallback']") as HTMLElement | null;
		expect(fallbackEl).toBeTruthy();
		await expect.element(fallbackEl!).toHaveTextContent("JD");
	});

	test("fallback element has aria-hidden='true'", async () => {
		const { container } = render(Avatar, {
			props: { alt: "Jane Doe", fallback: "JD" },
		});
		const fallbackEl = container.querySelector("[data-slot='fallback']") as HTMLElement | null;
		expect(fallbackEl).toBeTruthy();
		await expect.element(fallbackEl!).toHaveAttribute("aria-hidden", "true");
	});

	test("does not render fallback when fallback text is empty", async () => {
		const { container } = render(Avatar, { props: { alt: "User" } });
		const fallbackEl = container.querySelector("[data-slot='fallback']");
		expect(fallbackEl).toBeNull();
	});
});

// =============================================================================
// PROP PASSTHROUGH — ...rest spread
// =============================================================================

describe("avatar component — prop passthrough", () => {
	test("passes class prop and applies recipe", async () => {
		const { getByRole } = render(Avatar, { props: { alt: "User", class: "custom-avatar" } });
		const avatar = getByRole("img");
		await expect.element(avatar).toHaveClass("custom-avatar");
	});

	test("applies recipe size classes for sm variant", async () => {
		const { getByRole } = render(Avatar, { props: { alt: "User", size: "sm" } });
		const avatar = getByRole("img");
		await expect.element(avatar).toHaveClass("h-8");
		await expect.element(avatar).toHaveClass("w-8");
	});

	test("applies recipe size classes for lg variant", async () => {
		const { getByRole } = render(Avatar, { props: { alt: "User", size: "lg" } });
		const avatar = getByRole("img");
		await expect.element(avatar).toHaveClass("h-14");
		await expect.element(avatar).toHaveClass("w-14");
	});
});
