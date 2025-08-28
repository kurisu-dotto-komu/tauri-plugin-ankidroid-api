import { test, expect } from "@playwright/test";
import { setupTestEnvironment } from "../utils";

test.describe("AnkiDroid API Integration", () => {
  let page;

  test.beforeAll(async () => {
    const { page: newPage } = await setupTestEnvironment();
    page = newPage;
  });

  test("should automatically display AnkiDroid status on load", async ({}) => {
    console.log("Testing automatic AnkiDroid status display...");

    // Wait for status to appear automatically (app checks on mount)
    await page.waitForSelector("text=AnkiDroid Status:", { timeout: 5000 });

    // Verify status properties exist
    const statusSection = page
      .locator("div")
      .filter({ hasText: "AnkiDroid Status:" })
      .first();
    await expect(statusSection).toBeVisible();

    // Check that status items are displayed
    await expect(statusSection.locator("text=/Installed:/")).toBeVisible();
    await expect(statusSection.locator("text=/Has Permission:/")).toBeVisible();
    await expect(
      statusSection.locator("text=/Provider Reachable:/")
    ).toBeVisible();
    await expect(statusSection.locator("text=/Available:/")).toBeVisible();
    await expect(statusSection.locator("text=/Version:/")).toBeVisible();

    // Check if AnkiDroid is available
    const availableText = await statusSection
      .locator("li")
      .filter({ hasText: "Available:" })
      .textContent();
    const isAvailable = availableText?.includes("Yes");

    await expect(isAvailable).toBe(true);
    console.log(`AnkiDroid available: ${isAvailable}`);
  });

  test("should show appropriate button based on permission status", async ({}) => {
    // Wait for status to be loaded automatically
    await page.waitForSelector("text=AnkiDroid Status:", { timeout: 5000 });

    // Check the permission status to determine which button should be visible
    const statusSection = page
      .locator("div")
      .filter({ hasText: "AnkiDroid Status:" })
      .first();
    
    const hasPermissionText = await statusSection
      .locator("li")
      .filter({ hasText: "Has Permission:" })
      .textContent();
    const hasPermission = hasPermissionText?.includes("Yes");

    if (hasPermission) {
      // If has permission, Get Notes button should be visible and enabled
      const getNotesButton = page.getByRole("button", {
        name: "Get Notes (limit: 10)",
      });
      await expect(getNotesButton).toBeVisible();
      await expect(getNotesButton).toBeEnabled();
      console.log("Get Notes button is available (has permission)");
    } else {
      // If no permission, Request Permission button should be visible
      const requestPermissionButton = page.getByRole("button", {
        name: "Request Permission",
      });
      await expect(requestPermissionButton).toBeVisible();
      console.log("Request Permission button is available (no permission)");
    }
  });
});
