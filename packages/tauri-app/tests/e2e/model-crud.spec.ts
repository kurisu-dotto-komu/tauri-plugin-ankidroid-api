import { test, expect } from "@playwright/test";
import { setupTestEnvironment } from "../utils";

test.describe("Model CRUD Operations", () => {
  let page: any;

  test.beforeAll(async () => {
    const { page: newPage } = await setupTestEnvironment();
    page = newPage;

    // Navigate to Models view once
    const dropdownButton = page
      .locator("button")
      .filter({ hasText: "Notes" })
      .first();
    await dropdownButton.click();

    const modelsOption = page.locator("button").filter({ hasText: "Models" });
    await modelsOption.click();
  });

  test("should create a model with 3 custom fields", async ({}) => {
    // Generate a unique model name with timestamp
    const timestamp = Date.now();
    const modelName = `ThreeFieldModel_${timestamp}`;

    // Wait for the model name input to be visible
    const modelNameInput = page.locator("input[placeholder*='Basic']");
    await modelNameInput.waitFor({ state: "visible" });

    // Fill in the model name
    await modelNameInput.fill(modelName);

    // Modify the default fields
    const fieldInputs = page.locator("input[placeholder*='Field']");

    // Clear and set custom field names
    await fieldInputs.nth(0).fill("");
    await fieldInputs.nth(0).fill("Question");

    await fieldInputs.nth(1).fill("");
    await fieldInputs.nth(1).fill("Answer");

    // Add a third field by clicking Add Field button
    const addFieldButton = page.locator("button", { hasText: "Add Field" });
    await addFieldButton.click();

    // Fill the third field
    const updatedFieldInputs = page.locator("input[placeholder*='Field']");
    const newFieldCount = await updatedFieldInputs.count();
    expect(newFieldCount).toBe(3);

    await updatedFieldInputs.nth(2).fill("Explanation");

    // Click the Create Model button
    const createButton = page.locator("button", { hasText: "Create Model" });
    await createButton.click();

    // Wait for success message
    await page.waitForSelector("text=Model created successfully!");

    // Verify the model appears in the list
    await page.waitForSelector(`text=${modelName}`);

    // Verify the custom field names are displayed correctly in the model card
    const modelCard = page
      .locator(".bg-white.border.border-gray-200.rounded-xl")
      .filter({ hasText: modelName });
    await expect(modelCard).toBeVisible();

    // Check that the custom field names "Question", "Answer", and "Explanation" are displayed as tags
    await expect(
      modelCard.locator(".bg-blue-100.text-blue-700", { hasText: "Question" })
    ).toBeVisible();
    await expect(
      modelCard.locator(".bg-blue-100.text-blue-700", { hasText: "Answer" })
    ).toBeVisible();
    await expect(
      modelCard.locator(".bg-blue-100.text-blue-700", {
        hasText: "Explanation",
      })
    ).toBeVisible();
  });

  test("should show error when creating model without name", async ({}) => {
    // Leave the model name empty
    const modelNameInput = page.locator("input[placeholder*='Basic']");
    await modelNameInput.waitFor({ state: "visible" });
    await modelNameInput.fill("");

    // Try to click the Create Model button (should be disabled)
    const createButton = page.locator("button", { hasText: "Create Model" });

    // Verify the button is disabled when name is empty
    const isDisabled = await createButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test("should show error when creating model with empty fields", async ({}) => {
    // Generate a unique model name
    const timestamp = Date.now();
    const modelName = `InvalidModel_${timestamp}`;

    const modelNameInput = page.locator("input[placeholder*='Basic']");
    await modelNameInput.waitFor({ state: "visible" });
    await modelNameInput.fill(modelName);

    // Clear the field values
    const fieldInputs = page.locator("input[placeholder*='Field']");
    await fieldInputs.nth(0).fill("");
    await fieldInputs.nth(1).fill("");

    // Click the Create Model button
    const createButton = page.locator("button", { hasText: "Create Model" });
    await createButton.click();

    // Should show an error about empty fields
    const errorSelector = "[class*='error'], [class*='red']";
    await page.waitForSelector(errorSelector);

    const errorElement = await page.locator(errorSelector).first();
    const errorText = await errorElement.textContent();

    // Verify error mentions fields
    expect(errorText.toLowerCase()).toContain("field");
  });

  test.skip("should delete a model", async ({}) => {
    // First create a model to delete
    const timestamp = Date.now();
    const modelName = `DeleteTestModel_${timestamp}`;

    // Wait for the model name input to be visible
    const modelNameInput = page.locator("input[placeholder*='Basic']");
    await modelNameInput.waitFor({ state: "visible" });

    // Fill in the model name
    await modelNameInput.fill(modelName);

    // Click the Create Model button
    const createButton = page.locator("button", { hasText: "Create Model" });
    await createButton.click();

    // Wait for success message
    await page.waitForSelector("text=Model created successfully!");

    // Verify the model appears in the list
    await page.waitForSelector(`text=${modelName}`);

    // Verify the default field names are displayed correctly before deletion
    const modelCard = page
      .locator(".bg-white.border.border-gray-200.rounded-xl")
      .filter({ hasText: modelName });
    await expect(modelCard).toBeVisible();
    await expect(
      modelCard.locator(".bg-blue-100.text-blue-700", { hasText: "Front" })
    ).toBeVisible();
    await expect(
      modelCard.locator(".bg-blue-100.text-blue-700", { hasText: "Back" })
    ).toBeVisible();

    // Now test deletion: find the delete button in the model card
    const deleteButton = modelCard.locator("button[title='Delete Model']");
    await deleteButton.click();

    // Wait for confirmation modal
    await page.waitForSelector("text=Delete Model");
    await page.waitForSelector(
      `text=Are you sure you want to delete the model "${modelName}"?`
    );

    // Click the confirm delete button in the modal
    const confirmDeleteButton = page
      .locator("button", { hasText: "Delete" })
      .last();
    await confirmDeleteButton.click();

    // Wait for success message
    await page.waitForSelector(
      `text=Model "${modelName}" deleted successfully!`
    );

    // Verify the model is no longer in the list
    await expect(page.locator(`text=${modelName}`).first()).not.toBeVisible();
  });

  test.skip("should update a model", async ({}) => {
    // This test is skipped because model updates are not supported
    // by the AnkiDroid API - you can only create new models
  });
});
