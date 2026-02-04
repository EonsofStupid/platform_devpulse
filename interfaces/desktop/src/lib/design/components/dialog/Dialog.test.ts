/**
 * @file Dialog Component Layer — Vitest Browser Tests
 *
 * Tests the FULL component stack: ColdLightDialog state machine → transport →
 * spread attrs → native <dialog> element → recipe classes → blueprint defaults.
 *
 * Categories:
 *   1. Contract: data-kind, data-slot, data-state on every slot
 *   2. ARIA: role, aria-modal, aria-labelledby, aria-describedby, aria-haspopup, aria-expanded
 *   3. Native <dialog>: showModal integration, cancel event, top-layer
 *   4. Recipe: glass-void classes applied via blueprint defaults
 *   5. Open/Close: trigger click, close click, Escape, closeOnEscape=false
 *   6. Keyboard: Enter/Space on trigger
 *   7. Focus: trap within content, return to trigger on close
 *   8. Transport: slot attrs spread correctly, attachment actions wired
 */

import { describe, it, expect } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import DialogTest from "./Dialog.test.svelte";

// =============================================================================
// Helpers
// =============================================================================

/** Wait for async effects (showModal, tick, etc.) */
const wait = (ms = 150) => new Promise((r) => setTimeout(r, ms));

/** Render with open=true and wait for showModal to fire */
async function renderOpen(
  props?: Record<string, unknown>,
): Promise<ReturnType<typeof render>> {
  const screen = render(DialogTest, { open: true, ...props });
  await wait();
  return screen;
}

/** Click the trigger to open, wait for showModal */
async function openViaClick(
  screen: ReturnType<typeof render>,
): Promise<ReturnType<typeof render>> {
  const trigger = screen.getByRole("button", { name: "Open Dialog" });
  await trigger.click();
  await wait();
  return screen;
}

function querySlot(slot: string): Element | null {
  return document.querySelector(`[data-slot="${slot}"]`);
}

// =============================================================================
// 1. Contract Satisfaction — data-kind, data-slot, data-state
// =============================================================================

describe("Dialog: contract (data attributes)", () => {
  it("trigger: data-kind=dialog, data-slot=trigger", async () => {
    const screen = render(DialogTest);
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await expect.element(trigger).toHaveAttribute("data-kind", "dialog");
    await expect.element(trigger).toHaveAttribute("data-slot", "trigger");
  });

  it("all 9 slots present when open", async () => {
    await renderOpen();
    const expected = [
      "trigger", "portal", "overlay", "content",
      "title", "description", "close", "header", "footer",
    ];
    for (const slot of expected) {
      expect(querySlot(slot), `data-slot="${slot}" missing`).not.toBeNull();
    }
  });

  it("every slot has data-kind=dialog", async () => {
    await renderOpen();
    const slotNames = [
      "trigger", "portal", "overlay", "content",
      "title", "description", "close", "header", "footer",
    ];
    for (const name of slotNames) {
      const el = querySlot(name);
      if (!el) continue;
      expect(
        el.getAttribute("data-kind"),
        `${name} should have data-kind=dialog`,
      ).toBe("dialog");
    }
  });

  it("content has data-state=open when open", async () => {
    await renderOpen();
    expect(querySlot("content")?.getAttribute("data-state")).toBe("open");
  });

  it("overlay has data-state=open when open", async () => {
    await renderOpen();
    expect(querySlot("overlay")?.getAttribute("data-state")).toBe("open");
  });

  it("title renders correct text content", async () => {
    await renderOpen();
    expect(querySlot("title")?.textContent).toBe("Dialog Title");
  });

  it("description renders correct text content", async () => {
    await renderOpen();
    expect(querySlot("description")?.textContent).toBe("Dialog description text.");
  });
});

// =============================================================================
// 2. ARIA — ColdLight-native provides explicit ARIA attrs via transport
// =============================================================================

describe("Dialog: ARIA", () => {
  it("content has role=dialog (explicit attr from transport)", async () => {
    await renderOpen();
    expect(querySlot("content")?.getAttribute("role")).toBe("dialog");
  });

  it("content has aria-modal=true (explicit attr from transport)", async () => {
    await renderOpen();
    expect(querySlot("content")?.getAttribute("aria-modal")).toBe("true");
  });

  it("content aria-labelledby references title id", async () => {
    await renderOpen();
    const titleId = querySlot("title")?.getAttribute("id");
    expect(titleId, "title must have an id").toBeTruthy();
    expect(querySlot("content")?.getAttribute("aria-labelledby")).toBe(titleId);
  });

  it("content aria-describedby references description id", async () => {
    await renderOpen();
    const descId = querySlot("description")?.getAttribute("id");
    expect(descId, "description must have an id").toBeTruthy();
    expect(querySlot("content")?.getAttribute("aria-describedby")).toBe(descId);
  });

  it("title and description ids are unique", async () => {
    await renderOpen();
    const titleId = querySlot("title")?.getAttribute("id");
    const descId = querySlot("description")?.getAttribute("id");
    expect(titleId).toBeTruthy();
    expect(descId).toBeTruthy();
    expect(titleId).not.toBe(descId);
  });

  it("trigger has aria-haspopup=dialog", async () => {
    const screen = render(DialogTest);
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await expect.element(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("trigger has aria-expanded=false when closed", async () => {
    const screen = render(DialogTest);
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("trigger has aria-expanded=true when open", async () => {
    const screen = await renderOpen();
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("trigger aria-controls points to content id", async () => {
    const screen = await renderOpen();
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    const contentId = querySlot("content")?.getAttribute("id");
    expect(contentId).toBeTruthy();
    await expect.element(trigger).toHaveAttribute("aria-controls", contentId!);
  });

  it("overlay has aria-hidden=true", async () => {
    await renderOpen();
    expect(querySlot("overlay")?.getAttribute("aria-hidden")).toBe("true");
  });
});

// =============================================================================
// 3. Native <dialog> integration
// =============================================================================

describe("Dialog: native <dialog>", () => {
  it("content is a <dialog> element", async () => {
    await renderOpen();
    expect(querySlot("content")?.tagName).toBe("DIALOG");
  });

  it("dialog has open attribute after showModal", async () => {
    await renderOpen();
    const content = querySlot("content") as HTMLDialogElement | null;
    expect(content?.open).toBe(true);
  });

  it("close button has type=button", async () => {
    await renderOpen();
    expect(querySlot("close")?.getAttribute("type")).toBe("button");
  });

  it("trigger has type=button", async () => {
    const screen = render(DialogTest);
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await expect.element(trigger).toHaveAttribute("type", "button");
  });

  it("overlay has popover=manual attribute", async () => {
    await renderOpen();
    expect(querySlot("overlay")?.getAttribute("popover")).toBe("manual");
  });
});

// =============================================================================
// 4. Recipe application (glass-void via blueprint defaults)
// =============================================================================

describe("Dialog: recipe classes", () => {
  it("content has glass-void class from recipe", async () => {
    await renderOpen();
    expect(querySlot("content")?.classList.contains("glass-void")).toBe(true);
  });

  it("content has rounded-lg from radius token", async () => {
    await renderOpen();
    expect(querySlot("content")?.classList.contains("rounded-lg")).toBe(true);
  });

  it("overlay has backdrop-blur-md class from recipe", async () => {
    await renderOpen();
    expect(querySlot("overlay")?.classList.contains("backdrop-blur-md")).toBe(true);
  });

  it("title has text-lg class from recipe", async () => {
    await renderOpen();
    expect(querySlot("title")?.classList.contains("text-lg")).toBe(true);
  });

  it("title has font-semibold class from recipe", async () => {
    await renderOpen();
    expect(querySlot("title")?.classList.contains("font-semibold")).toBe(true);
  });

  it("description has text-sm class from recipe", async () => {
    await renderOpen();
    expect(querySlot("description")?.classList.contains("text-sm")).toBe(true);
  });

  it("header has flex layout classes from recipe", async () => {
    await renderOpen();
    const header = querySlot("header");
    expect(header?.classList.contains("flex")).toBe(true);
    expect(header?.classList.contains("flex-col")).toBe(true);
  });

  it("footer has flex class from recipe", async () => {
    await renderOpen();
    expect(querySlot("footer")?.classList.contains("flex")).toBe(true);
  });
});

// =============================================================================
// 5. Open/Close behavior
// =============================================================================

describe("Dialog: open/close", () => {
  it("content has data-state=closed when not open", async () => {
    render(DialogTest);
    await wait();
    const content = querySlot("content");
    // Native <dialog> stays in DOM but is not shown as modal
    if (content) {
      expect(content.getAttribute("data-state")).toBe("closed");
      expect((content as HTMLDialogElement).open).toBe(false);
    }
  });

  it("clicking trigger opens the dialog", async () => {
    const screen = render(DialogTest);
    await openViaClick(screen);
    const content = querySlot("content");
    expect(content).not.toBeNull();
    expect(content?.getAttribute("data-state")).toBe("open");
  });

  it("clicking close button closes the dialog", async () => {
    await renderOpen();
    const closeBtn = querySlot("close") as HTMLElement;
    expect(closeBtn).not.toBeNull();
    await closeBtn.click();
    await wait();

    const content = querySlot("content");
    expect(
      content === null || content.getAttribute("data-state") === "closed",
    ).toBe(true);
  });

  it("Escape key closes the dialog", async () => {
    await renderOpen();
    expect(querySlot("content")).not.toBeNull();

    await userEvent.keyboard("{Escape}");
    await wait();

    const after = querySlot("content");
    expect(
      after === null || after.getAttribute("data-state") === "closed",
    ).toBe(true);
  });

  it("Escape does NOT close when closeOnEscape=false", async () => {
    await renderOpen({ closeOnEscape: false });
    expect(querySlot("content")).not.toBeNull();

    await userEvent.keyboard("{Escape}");
    await wait();

    const after = querySlot("content");
    expect(after).not.toBeNull();
    expect(after?.getAttribute("data-state")).toBe("open");
  });

  it("data-state transitions to closed on close", async () => {
    await renderOpen();
    expect(querySlot("content")?.getAttribute("data-state")).toBe("open");

    const closeBtn = querySlot("close") as HTMLElement;
    await closeBtn.click();
    await wait();

    const content = querySlot("content");
    if (content) {
      expect(content.getAttribute("data-state")).toBe("closed");
    }
  });

  it("overlay data-state mirrors content state", async () => {
    await renderOpen();
    expect(querySlot("overlay")?.getAttribute("data-state")).toBe("open");
  });
});

// =============================================================================
// 6. Keyboard interaction
// =============================================================================

describe("Dialog: keyboard", () => {
  it("Enter on trigger opens dialog", async () => {
    const screen = render(DialogTest);
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await trigger.element().focus();
    await userEvent.keyboard("{Enter}");
    await wait();
    expect(querySlot("content")).not.toBeNull();
  });

  it("Space on trigger opens dialog", async () => {
    const screen = render(DialogTest);
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await trigger.element().focus();
    await userEvent.keyboard(" ");
    await wait();
    expect(querySlot("content")).not.toBeNull();
  });
});

// =============================================================================
// 7. Focus management
// =============================================================================

describe("Dialog: focus management", () => {
  it("moves focus into dialog when opened via trigger click", async () => {
    const screen = render(DialogTest);
    await openViaClick(screen);
    expect(querySlot("content")?.contains(document.activeElement)).toBe(true);
  });

  it("traps focus within dialog (Tab cycles inside)", async () => {
    const screen = render(DialogTest);
    await openViaClick(screen);
    const content = querySlot("content");
    for (let i = 0; i < 10; i++) {
      await userEvent.keyboard("{Tab}");
    }
    expect(content?.contains(document.activeElement)).toBe(true);
  });

  it("returns focus to trigger when closed via Escape", async () => {
    const screen = render(DialogTest);
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await trigger.click();
    await wait();

    await userEvent.keyboard("{Escape}");
    await wait();

    await expect.element(trigger).toHaveFocus();
  });

  it("returns focus to trigger when closed via close button", async () => {
    const screen = render(DialogTest);
    const trigger = screen.getByRole("button", { name: "Open Dialog" });
    await trigger.click();
    await wait();

    const closeBtn = querySlot("close") as HTMLElement;
    await closeBtn.click();
    await wait();

    await expect.element(trigger).toHaveFocus();
  });
});

// =============================================================================
// 8. Transport integrity — IDs, attrs, wiring
// =============================================================================

describe("Dialog: transport integrity", () => {
  it("content has a unique id from transport id generator", async () => {
    await renderOpen();
    const id = querySlot("content")?.getAttribute("id");
    expect(id).toBeTruthy();
    expect(id).toMatch(/^dlg-\d+-content$/);
  });

  it("title id follows naming convention", async () => {
    await renderOpen();
    const id = querySlot("title")?.getAttribute("id");
    expect(id).toBeTruthy();
    expect(id).toMatch(/^dlg-\d+-title$/);
  });

  it("description id follows naming convention", async () => {
    await renderOpen();
    const id = querySlot("description")?.getAttribute("id");
    expect(id).toBeTruthy();
    expect(id).toMatch(/^dlg-\d+-desc$/);
  });

  it("content, title, description ids share same base", async () => {
    await renderOpen();
    const contentId = querySlot("content")?.getAttribute("id") ?? "";
    const titleId = querySlot("title")?.getAttribute("id") ?? "";
    const descId = querySlot("description")?.getAttribute("id") ?? "";

    const contentBase = contentId.replace(/-content$/, "");
    const titleBase = titleId.replace(/-title$/, "");
    const descBase = descId.replace(/-desc$/, "");

    expect(contentBase).toBe(titleBase);
    expect(contentBase).toBe(descBase);
  });

  it("two dialog instances get different id bases", async () => {
    const screen1 = await renderOpen();
    const id1 = querySlot("content")?.getAttribute("id") ?? "";
    screen1.unmount();

    const screen2 = await renderOpen();
    const id2 = querySlot("content")?.getAttribute("id") ?? "";
    screen2.unmount();

    expect(id1).not.toBe(id2);
  });
});
