import { test, expect, Page } from "@playwright/test";
import { setupTestEnvironment } from "../utils";

test.describe("Notes Management", async () => {
  let page: Page;
  test.beforeAll(async () => {
    console.log("Setting up test environment...");
    const { page: newPage } = await setupTestEnvironment();
    page = newPage;
    console.log("Test environment setup complete");

    // Add event listeners for debugging
    page.on('close', () => console.log('❌ Page closed!'));
    page.on('crash', () => console.log('💥 Page crashed!'));
    page.on('error', (error) => console.log('🚨 Page error:', error));
    page.on('pageerror', (error) => console.log('🚨 Page error (pageerror):', error));
  });

  test("should fetch and display notes from AnkiDroid", async ({}) => {
    console.log("Starting notes test...");
    console.log("Current page URL:", await page.url());
    console.log("Page title:", await page.title());
    
    // Check if page is still alive
    if (page.isClosed()) {
      console.log("❌ Page is already closed!");
      throw new Error("Page was closed before test started");
    }

    console.log("Looking for Get Notes button...");
    const getNotesButton = page.getByRole("button", {
      name: "Get Notes (limit: 10)",
    });
    
    // Check if button exists first
    try {
      await getNotesButton.waitFor({ timeout: 5000 });
      console.log("✅ Get Notes button found");
    } catch (e) {
      console.log("❌ Get Notes button not found, taking screenshot...");
      await page.screenshot({ path: "debug-button-not-found.png" });
      throw e;
    }
    
    console.log("Clicking Get Notes button...");
    await getNotesButton.click();

    console.log("Button clicked, waiting for notes to appear...");
    
    // Check if page is still alive after clicking
    if (page.isClosed()) {
      console.log("❌ Page closed after clicking button!");
      throw new Error("Page was closed after clicking the Get Notes button");
    }

    // Wait for notes to appear (we expect notes to always exist now)
    try {
      await page.waitForSelector("text=/Notes \\(\\d+\\):/", { timeout: 10000 });
      console.log("✅ Notes section appeared");
    } catch (e) {
      console.log("❌ Notes section did not appear, checking page state...");
      console.log("Page closed?", page.isClosed());
      if (!page.isClosed()) {
        console.log("Taking screenshot for debugging...");
        await page.screenshot({ path: "debug-notes-not-found.png" });
        console.log("Current page content:", await page.content());
      }
      throw e;
    }

    const notesSection = page
      .locator("div")
      .filter({ hasText: /Notes \(\d+\):/ })
      .first();
    await expect(notesSection).toBeVisible();

    // Verify note elements exist
    const noteElements = notesSection.locator("div[style*='border']");
    const noteCount = await noteElements.count();
    
    expect(noteCount).toBeGreaterThan(0);
    console.log(`Found ${noteCount} notes`);

    // Check first note structure
    const firstNote = noteElements.first();
    await expect(firstNote.locator("text=/^ID:/")).toBeVisible();
    await expect(firstNote.locator("text=/Deck ID:/")).toBeVisible();
    await expect(firstNote.locator("text=/Model ID:/")).toBeVisible();
    await expect(firstNote.locator("text=/Fields:/")).toBeVisible();
    await expect(firstNote.locator("text=/Tags:/")).toBeVisible();
    await expect(firstNote.locator("text=/Sort Field:/")).toBeVisible();
  });
});
