/**
 * @file wizard-happy-path.spec.ts
 * E2E test: Welcome → Hardware → Models → Clyffy → Complete
 *
 * REQUIRES: `cargo xtask run-dev` running on port 1420.
 * Run: pnpm test:e2e:ui (to watch in browser)
 */

import { expect, test } from "@playwright/test";

test.describe("Setup Wizard — Happy Path", () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the app — wizard shows on first launch
		await page.goto("/");
		// Wait for the wizard shell to appear
		await page.waitForSelector("[data-component='setup-wizard']", { timeout: 15_000 });
	});

	test("Welcome screen shows Clyffy greeting and hardware preview", async ({ page }) => {
		// Clyffy avatar visible
		await expect(page.locator(".avatar-letter")).toHaveText("C");

		// Greeting visible
		await expect(page.getByText("Hey! I'm Clyffy.")).toBeVisible();
		await expect(page.getByText("It only takes a minute")).toBeVisible();

		// Hardware preview should show GPU/CPU/RAM (if detected)
		const hwPreview = page.locator(".hw-preview");
		// At least one hardware row should be visible
		const hwRows = hwPreview.locator(".hw-row");
		await expect(hwRows.first()).toBeVisible({ timeout: 5_000 });

		// "Let's Go" button visible and clickable
		const cta = page.getByRole("button", { name: "Start setup" });
		await expect(cta).toBeVisible();
		await expect(cta).toBeEnabled();
	});

	test("Click Let's Go → Hardware Detection with tier badge", async ({ page }) => {
		// Click the CTA
		await page.getByRole("button", { name: "Start setup" }).click();

		// Wait for hardware scanning animation
		await expect(page.getByText("Scanning your hardware")).toBeVisible({ timeout: 5_000 });

		// Wait for scan to complete (2s fake delay + real scan)
		await expect(page.getByText("Hardware Detected")).toBeVisible({ timeout: 10_000 });

		// Tier badge should appear
		const tierBadge = page.locator(".tier-badge");
		await expect(tierBadge).toBeVisible();

		// Tier name should be one of the known tiers
		const tierName = await tierBadge.locator(".tier-name").textContent();
		expect(["Workstation", "Prosumer", "Mainstream", "Entry", "CPU Mode", "Minimal"]).toContain(
			tierName,
		);

		// Hardware metrics visible
		await expect(page.locator(".metrics")).toBeVisible();

		// Continue button visible
		const continueBtn = page.getByRole("button", { name: "Continue to model selection" });
		await expect(continueBtn).toBeVisible();
	});

	test("Continue → Models step shows PresetCard with recommendations", async ({ page }) => {
		// Navigate through Welcome → Hardware → Models
		await page.getByRole("button", { name: "Start setup" }).click();
		await expect(page.getByText("Hardware Detected")).toBeVisible({ timeout: 10_000 });
		await page.getByRole("button", { name: "Continue to model selection" }).click();

		// Models step header
		await expect(page.getByText("Set Up Your AI")).toBeVisible({ timeout: 5_000 });

		// PresetCard should show "Recommended for your [GPU]"
		const presetCard = page.locator(".preset-card");
		await expect(presetCard).toBeVisible({ timeout: 10_000 });
		await expect(presetCard.getByText(/Recommended for your/)).toBeVisible();

		// Should have model items with layman names
		const items = presetCard.locator(".preset-item");
		const count = await items.count();
		expect(count).toBeGreaterThan(0);

		// First item should have a friendly name (not a filename)
		const firstName = await items.first().locator(".item-name").textContent();
		expect(firstName).toBeTruthy();
		expect(firstName).not.toContain(".gguf");

		// VramBar visible at bottom
		await expect(page.locator(".vram-bar-wrap")).toBeVisible();

		// "Download & Set Up" button visible
		await expect(page.getByRole("button", { name: /Download|Set Up/ })).toBeVisible();

		// Escape hatches visible
		await expect(page.getByText("Customize individual models")).toBeVisible();
		await expect(page.getByText("Browse or import models")).toBeVisible();
	});

	test("Download & Set Up shows progress with friendly names", async ({ page }) => {
		// Navigate to Models step
		await page.getByRole("button", { name: "Start setup" }).click();
		await expect(page.getByText("Hardware Detected")).toBeVisible({ timeout: 10_000 });
		await page.getByRole("button", { name: "Continue to model selection" }).click();
		await expect(page.locator(".preset-card")).toBeVisible({ timeout: 10_000 });

		// Click Download & Set Up
		await page.getByRole("button", { name: /Download|Set Up/ }).click();

		// Download section should appear
		const dlSection = page.locator(".download-section");
		await expect(dlSection).toBeVisible({ timeout: 10_000 });

		// Should show friendly names, not raw filenames
		const dlNames = dlSection.locator(".dl-name");
		const nameCount = await dlNames.count();
		if (nameCount > 0) {
			const firstDlName = await dlNames.first().textContent();
			expect(firstDlName).toBeTruthy();
			// Should be a layman name like "Clyffy's Brain" not "Qwen3-4B-Q4_K_M.gguf"
			expect(firstDlName).not.toContain(".gguf");
		}
	});
});
