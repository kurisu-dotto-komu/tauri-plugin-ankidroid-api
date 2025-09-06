import { _android as android } from "playwright";

export async function getDevice() {
  const [device] = await android.devices();
  console.log(`Using device: ${device.model()} (${device.serial()})`);
  return device;
}

export async function wait(timeout: number = 1000) {
  await new Promise((resolve) => setTimeout(resolve, timeout));
}

export async function restartApp(device: any) {
  await device.shell("am force-stop com.demo.tauri_app");
  await device.shell("am start -n com.demo.tauri_app/.MainActivity");
  await wait();
}

export async function getAppPage(device: any) {
  const webview = await device.webView({ pkg: "com.demo.tauri_app" });
  const page = await webview.page();

  // Wait for page to load
  await page.waitForLoadState("networkidle");

  // Set up console log listener
  page.on("console", (msg) => {
    console.log(`[Browser Console ${msg.type()}]:`, msg.text());
  });

  return page;
}

export async function setupTestEnvironment() {
  const device = await getDevice();
  await restartApp(device);
  const page = await getAppPage(device);
  return { device, page };
}
