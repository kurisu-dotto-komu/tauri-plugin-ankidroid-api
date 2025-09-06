import { test, expect, Page } from "@playwright/test";
import { execSync } from "child_process";
import { setupTestEnvironment, wait } from "../utils";
import { AndroidDevice } from "playwright";
import { restartApp } from "../utils";

// Helper function to check if app is ready
async function checkAppIsReady(page: Page) {
  const notesOption = page.locator("text=Notes");
  const createNoteButton = page.locator("text=Create New Note");

  return await expect
    .poll(
      async () => {
        const notesVisible = await notesOption.isVisible().catch(() => false);
        const createNoteVisible = await createNoteButton
          .isVisible()
          .catch(() => false);
        return notesVisible || createNoteVisible;
      },
      {
        message: "Waiting for app to show main interface",
        timeout: 10000,
      }
    )
    .toBeTruthy();
}

test.describe("AnkiDroid Onboarding Flow", () => {
  let page: Page;
  let device: AndroidDevice;

  test.beforeAll(async () => {
    const testEnv = await setupTestEnvironment();
    page = testEnv.page;
    device = testEnv.device;
  });

  test("should complete full onboarding flow with permission button", async ({}) => {
    // Start with AnkiDroid uninstalled

    try {
      execSync("emu --silent anki uninstall", { stdio: "inherit" });
    } catch (error) {}

    // Restart app to ensure clean state
    await restartApp(device);
    const webview = await device.webView({ pkg: "com.demo.tauri_app" });
    page = await webview.page();
    await page.waitForLoadState("networkidle");

    // Step 1: Check for 'AnkiDroid Not Installed' message

    // Wait for the AnkiDroid Not Installed card to appear
    await page.waitForSelector("text=AnkiDroid Not Installed", {
      timeout: 10000,
    });

    // Verify the installation instructions are shown
    const notInstalledCard = page.locator("text=AnkiDroid Not Installed");
    await expect(notInstalledCard).toBeVisible();

    // Check for the description text
    const descriptionText = page.locator(
      "text=AnkiDroid is not installed on this device"
    );
    await expect(descriptionText).toBeVisible();

    // Step 2: Install AnkiDroid

    execSync("emu --silent anki install", { stdio: "inherit" });
    await wait();

    // Step 3: Switch back to Tauri app (AnkiDroid is launched after install)
    // Force stop and restart the Tauri app to bring it to foreground
    await restartApp(device);

    // Get new page reference after restart
    const webview2 = await device.webView({ pkg: "com.demo.tauri_app" });
    page = await webview2.page();
    await page.waitForLoadState("networkidle");

    // Step 4: Check for grant permissions screen

    // Wait for the Permission Required card to appear
    await page.waitForSelector("text=Permission Required", { timeout: 10000 });

    // Verify the permission card is shown
    const permissionCard = page.locator("text=Permission Required");
    await expect(permissionCard).toBeVisible();

    // Check for the description mentioning AnkiDroid is installed
    const permissionDescription = page.locator(
      "text=/AnkiDroid.*is installed but we need permission/"
    );
    await expect(permissionDescription).toBeVisible();

    // Check for Grant Permission button
    const grantPermissionButton = page.getByRole("button", {
      name: "Grant Permission",
    });
    await expect(grantPermissionButton).toBeVisible();

    // Step 5: Click permission button and handle permission dialog

    await grantPermissionButton.click();

    // Wait for Android permission dialog to appear
    await wait();

    // Click "Allow" in the Android permission dialog
    await device.shell(`input keyevent KEYCODE_TAB`); // Navigate to Allow button
    await device.shell(`input keyevent KEYCODE_ENTER`); // Click

    // Wait for the modal to close and app to auto-update
    await page.waitForTimeout(3000);

    // The app should automatically update to show the main content
    await checkAppIsReady(page);
  });

  test("should skip onboarding when AnkiDroid is already installed with permissions", async ({}) => {
    // Install AnkiDroid and grant permissions upfront
    execSync("emu --silent anki install", { stdio: "inherit" });
    await wait();
    execSync("emu --silent anki permissions", { stdio: "inherit" });

    // Restart the app with everything already configured
    await restartApp(device);
    const webview = await device.webView({ pkg: "com.demo.tauri_app" });
    page = await webview.page();
    await page.waitForLoadState("networkidle");

    // The app should skip onboarding and show the main interface immediately
    await checkAppIsReady(page);
  });
});
