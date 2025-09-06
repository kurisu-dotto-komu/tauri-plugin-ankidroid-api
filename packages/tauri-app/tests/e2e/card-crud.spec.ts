import { test, expect } from "@playwright/test";
import { setupTestEnvironment } from "../utils";

async function waitForFn(page: any, fn: () => Promise<boolean>, timeout: number, message: string) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await fn()) {
      return;
    }
    await page.waitForTimeout(100);
  }
  throw new Error(`Timeout: ${message}`);
}

test.describe("Card CRUD Operations", () => {
  let page: any;

  test.beforeEach(async () => {
    const { page: newPage } = await setupTestEnvironment();
    page = newPage;
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Navigate to Notes tab by clicking on it
    const notesTab = page.locator("button").filter({ hasText: "Notes" });
    await notesTab.click();
    await page.waitForTimeout(1000);
  });

  test("should create a note using default deck and model", async ({}) => {
    // Wait for the model dropdown to be visible
    const modelSelect = page.locator("select").first();
    await modelSelect.waitFor({ state: "visible", timeout: 5000 });
    
    // Select the Basic model if available
    const options = await modelSelect.locator("option").count();
    if (options > 1) {
      // Select the first non-placeholder option
      await modelSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
    
    // Wait for fields to appear
    await page.waitForSelector("input[placeholder*='Enter']", { timeout: 5000 });
    
    // Fill in the fields
    const fieldInputs = page.locator("input[placeholder*='Enter']");
    const fieldCount = await fieldInputs.count();
    
    // Fill Front field
    if (fieldCount > 0) {
      await fieldInputs.nth(0).fill("Test Question");
    }
    
    // Fill Back field
    if (fieldCount > 1) {
      await fieldInputs.nth(1).fill("Test Answer");
    }
    
    // Add some tags
    await page.locator("input[placeholder='tag1, tag2, tag3']").fill("test, e2e");
    
    // Click the Create Note button
    const createButton = page.locator("button", { hasText: "Create Note" });
    await createButton.click();
    
    // Wait for success message
    await page.waitForSelector("text=Note created successfully!", { timeout: 10000 });
    
    // Verify the note appears in the list
    await page.waitForSelector("text=Test Question", { timeout: 5000 });
  });
});