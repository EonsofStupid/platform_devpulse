/**
 * @file wizard-customize.spec.ts
 * E2E test: Customize individual slots, swap models, role colors
 *
 * REQUIRES: `cargo xtask run-dev` running on port 1420.
 * Run: pnpm test:e2e:ui (to watch in browser)
 */

import { expect, test } from "@playwright/test";

test.describe("Setup Wizard — Customize", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector("[data-component='setup-wizard']", { timeout: 15_000 });

		// Navigate: Welcome → Hardware → Models
		await page.getByRole("button", { name: "Start setup" }).click();
		await expect(page.getByText("Hardware Detected")).toBeVisible({ timeout: 10_000 });
		await page.getByRole("button", { name: "Continue to model selection" }).click();
		await expect(page.getByText("Set Up Your AI")).toBeVisible({ timeout: 5_000 });
	});

	test("Customize individual models → shows slot cards grouped by role", async ({ page }) => {
		// Click customize
		await page.getByText("Customize individual models").click();

		// Should show Customize header
		await expect(page.getByText("Customize Models")).toBeVisible({ timeout: 5_000 });

		// Should have role group headers
		await expect(page.getByText("Thinking")).toBeVisible();
		await expect(page.getByText("Understanding")).toBeVisible();
		await expect(page.getByText("Talking")).toBeVisible();

		// Slot cards should be visible
		await expect(page.getByText("Clyffy's Brain")).toBeVisible();
		await expect(page.getByText("Minion Core")).toBeVisible();
		await expect(page.getByText("Memory Search")).toBeVisible();
		await expect(page.getByText("Voice Input")).toBeVisible();
		await expect(page.getByText("Voice Output")).toBeVisible();
	});

	test("Each slot card has a Change button", async ({ page }) => {
		await page.getByText("Customize individual models").click();
		await expect(page.getByText("Customize Models")).toBeVisible({ timeout: 5_000 });

		// Every slot card should have a Change button
		const changeButtons = page.getByText("Change");
		const count = await changeButtons.count();
		expect(count).toBeGreaterThanOrEqual(5); // at least 5 slots
	});

	test("Click Change opens SlotSwapPopup with model options", async ({ page }) => {
		await page.getByText("Customize individual models").click();
		await expect(page.getByText("Customize Models")).toBeVisible({ timeout: 5_000 });

		// Click Change on first slot card
		const firstChange = page.getByText("Change").first();
		await firstChange.click();

		// Popup should appear
		const popup = page.locator("[role='dialog']");
		await expect(popup).toBeVisible({ timeout: 3_000 });

		// Should have "Change [slot name]" title
		await expect(popup.locator(".popup-title")).toBeVisible();

		// Should have "Browse all models" link at bottom
		await expect(popup.getByText(/Browse all models/)).toBeVisible();

		// Close with X button or backdrop
		await popup.getByRole("button", { name: "Close" }).click();
		await expect(popup).not.toBeVisible({ timeout: 2_000 });
	});

	test("Role color borders are visible (not transparent)", async ({ page }) => {
		await page.getByText("Customize individual models").click();
		await expect(page.getByText("Customize Models")).toBeVisible({ timeout: 5_000 });

		// Get first slot card
		const firstCard = page.locator(".slot-card").first();
		await expect(firstCard).toBeVisible();

		// Check that border-left-color is NOT transparent
		const borderColor = await firstCard.evaluate((el) => {
			return window.getComputedStyle(el).borderLeftColor;
		});
		// Should be a real color, not transparent or empty
		expect(borderColor).not.toBe("transparent");
		expect(borderColor).not.toBe("");
		expect(borderColor).not.toBe("rgba(0, 0, 0, 0)");
	});

	test("VramBar visible on customize page", async ({ page }) => {
		await page.getByText("Customize individual models").click();
		await expect(page.getByText("Customize Models")).toBeVisible({ timeout: 5_000 });

		await expect(page.locator(".vram-bar-wrap")).toBeVisible();
	});

	test("Done Customizing returns to models step", async ({ page }) => {
		await page.getByText("Customize individual models").click();
		await expect(page.getByText("Customize Models")).toBeVisible({ timeout: 5_000 });

		await page.getByRole("button", { name: "Done Customizing" }).click();

		await expect(page.getByText("Set Up Your AI")).toBeVisible({ timeout: 5_000 });
	});

	test("Current Setup popup shows all slots", async ({ page }) => {
		// Setup button should be in the phase bar
		const setupBtn = page.getByRole("button", { name: "View current setup" });
		await expect(setupBtn).toBeVisible();

		// Click it
		await setupBtn.click();

		// Popup should show
		const popup = page.locator("[role='dialog'][aria-label='Current setup overview']");
		await expect(popup).toBeVisible({ timeout: 3_000 });

		// Should list slot names
		await expect(popup.getByText("Clyffy's Brain")).toBeVisible();
		await expect(popup.getByText("Minion Core")).toBeVisible();

		// Close
		await popup.getByRole("button", { name: "Close" }).click();
	});
});
