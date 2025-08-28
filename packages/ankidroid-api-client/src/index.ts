import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";
import { StatusSchema, NoteSchema, PermissionSchema } from "./schema";
import { NotSupportedError } from "./errors";
import type { AnkiDroidStatus, Note, GetNotesOptions, PermissionStatus } from "./types";

export { NotSupportedError, AnkiDroidError } from "./errors";
export type { AnkiDroidStatus, Note, GetNotesOptions, PermissionStatus } from "./types";

function isAndroid(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent.includes("Android");
}

export async function checkPermission(): Promise<PermissionStatus> {
  // Remove Android check for testing - the plugin will handle platform detection
  try {
    const raw = await invoke("plugin:ankidroid-api|checkPermission");
    return PermissionSchema.parse(raw);
  } catch (error) {
    console.error("Error checking permission:", error);
    return {
      granted: false,
      permission: "com.ichi2.anki.permission.READ_WRITE_DATABASE",
    };
  }
}

export async function requestPermission(): Promise<PermissionStatus> {
  // Remove Android check for testing - the plugin will handle platform detection
  try {
    const raw = await invoke("plugin:ankidroid-api|requestPermission");
    return PermissionSchema.parse(raw);
  } catch (error) {
    throw new Error(`Failed to request permission: ${error}`);
  }
}

export async function isAnkiDroidAvailable(): Promise<AnkiDroidStatus> {
  // Remove Android check for testing - the plugin will handle platform detection
  console.log("isAnkiDroidAvailable: Starting check");
  console.log("User Agent:", typeof navigator !== "undefined" ? navigator.userAgent : "undefined");
  
  try {
    console.log("isAnkiDroidAvailable: Invoking plugin command");
    const raw = await invoke("plugin:ankidroid-api|isAnkiDroidAvailable");
    console.log("isAnkiDroidAvailable: Raw response:", raw);
    const parsed = StatusSchema.parse(raw);
    console.log("isAnkiDroidAvailable: Parsed status:", parsed);
    return parsed;
  } catch (error) {
    console.error("Error checking AnkiDroid availability:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      installed: false,
      hasPermission: false,
      providerReachable: false,
      available: false,
      version: null,
    };
  }
}

export async function getNotes(opts?: GetNotesOptions): Promise<Note[]> {
  // Remove Android check for testing - the plugin will handle platform detection
  try {
    const raw = await invoke("plugin:ankidroid-api|getNotes", { ...(opts ?? {}) });
    // The Kotlin plugin returns { notes: [...] }
    const response = raw as { notes?: unknown[] };
    return z.array(NoteSchema).parse(response.notes || []);
  } catch (error) {
    if (error instanceof NotSupportedError) {
      throw error;
    }
    throw new Error(`Failed to get notes: ${error}`);
  }
}