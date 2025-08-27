import { test, expect } from "@playwright/test";

import { _android as android } from "playwright";

test.describe("Rust Greet Function", () => {
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
