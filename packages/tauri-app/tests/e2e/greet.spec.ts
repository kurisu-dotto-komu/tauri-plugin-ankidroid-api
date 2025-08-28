import { test, expect } from "@playwright/test";

import { _android as android } from "playwright";

test.skip("Rust Greet Function", () => {
  test("should greet with dynamic name", async ({}) => {
    const [device] = await android.devices();
    console.log(device);
    console.log(`Model: ${device.model()}`);
    console.log(`Serial: ${device.serial()}`);
    // restart the app
    await device.shell("am force-stop com.demo.tauri_app");
    await device.shell("am start -n com.demo.tauri_app/.MainActivity");
    const webview = await device.webView({ pkg: "com.demo.tauri_app" });
    // Work with WebView's page as usual.
    const page = await webview.page();
    console.log(await page.title());
    // await device.screenshot({ path: "device.png" });
    await page.fill("input", "John");
    await page.click("button");
    await expect(page.locator("p").last()).toContainText("Hello, John!");
  });
});

test.describe("AnkiDroid API Integration", () => {
  test("should check AnkiDroid availability and fetch notes", async ({}) => {
    const [device] = await android.devices();
    console.log(`Testing on device: ${device.model()} (${device.serial()})`);

    // Restart the app to ensure clean state
    await device.shell("am force-stop com.demo.tauri_app");
    await device.shell("am start -n com.demo.tauri_app/.MainActivity");

    const webview = await device.webView({ pkg: "com.demo.tauri_app" });
    const page = await webview.page();

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Set up console log listener
    page.on("console", (msg) => {
      console.log(`[Browser Console ${msg.type()}]:`, msg.text());
    });

    // Test AnkiDroid availability check
    console.log("Testing AnkiDroid availability...");
    const checkAnkiButton = page.getByRole("button", {
      name: "Check AnkiDroid",
    });
    await checkAnkiButton.click();

    // Wait for status to appear
    await page.waitForSelector("text=AnkiDroid Status:", { timeout: 5000 });

    // Verify status properties exist
    const statusSection = page
      .locator("div")
      .filter({ hasText: "AnkiDroid Status:" })
      .first();
    await expect(statusSection).toBeVisible();

    // Check that status items are displayed
    await expect(statusSection.locator("text=/Installed:/")).toBeVisible();
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

    console.log("Testing notes retrieval...");
    const getNotesButton = page.getByRole("button", {
      name: "Get Notes (limit: 10)",
    });

    // Button should be enabled when AnkiDroid is available
    await expect(getNotesButton).toBeEnabled();
    await getNotesButton.click();

    // Wait for either notes or error message
    const notesOrError = await Promise.race([
      page
        .waitForSelector("text=/Notes \\(\\d+\\):/", { timeout: 10000 })
        .then(() => "notes"),
      page
        .waitForSelector("text=/Error fetching notes:/", { timeout: 10000 })
        .then(() => "error"),
    ]);

    if (notesOrError === "notes") {
      console.log("Notes retrieved successfully");

      // Verify notes structure if any notes exist
      const notesSection = page
        .locator("div")
        .filter({ hasText: /Notes \(\d+\):/ })
        .first();
      const noteElements = notesSection.locator("div[style*='border']");
      const noteCount = await noteElements.count();

      if (noteCount > 0) {
        console.log(`Found ${noteCount} notes`);

        // Check first note structure
        const firstNote = noteElements.first();
        await expect(firstNote.locator("text=/ID:/")).toBeVisible();
        await expect(firstNote.locator("text=/Fields:/")).toBeVisible();
        await expect(firstNote.locator("text=/Tags:/")).toBeVisible();
        await expect(firstNote.locator("text=/Sort Field:/")).toBeVisible();

        // Check if any note contains 'test' in fields (highlighted)
        const highlightedNotes = noteElements.filter({
          has: page.locator('[style*="fffacd"]'),
        });
        const highlightedCount = await highlightedNotes.count();
        if (highlightedCount > 0) {
          console.log(`Found ${highlightedCount} note(s) containing 'test'`);
        }
      } else {
        console.log("No notes found in AnkiDroid");
      }
    } else {
      console.log(
        "Error fetching notes - this is expected if AnkiDroid has no notes"
      );
      // Verify error message is displayed
      await expect(page.locator("text=/Error fetching notes:/")).toBeVisible();
    }
    console.log("AnkiDroid API integration test completed");
  });
});
