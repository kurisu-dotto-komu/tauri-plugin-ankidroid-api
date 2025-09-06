import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import {
  isAnkiDroidAvailable,
  requestPermission,
} from "ankidroid-api-client";
import type { AnkiDroidStatus } from "ankidroid-api-client";

interface AnkiContextValue {
  status: AnkiDroidStatus | null;
  isConnected: boolean;
  error: string;
  requestPermission: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

const AnkiContext = createContext<AnkiContextValue | undefined>(undefined);

export function AnkiProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AnkiDroidStatus | null>(null);
  const [error, setError] = useState<string>("");

  const checkConnection = async () => {
    console.log("🔍 checkAnkiDroid called");
    try {
      console.log("User Agent:", navigator.userAgent);
      console.log("Is Android check:", navigator.userAgent.includes("Android"));
      console.log("📡 Calling isAnkiDroidAvailable...");
      const ankiStatus = await isAnkiDroidAvailable();
      console.log("✅ isAnkiDroidAvailable result:", ankiStatus);
      setStatus(ankiStatus);
      setError("");
    } catch (err) {
      console.log("❌ Error in checkAnkiDroid:", err);
      setError(`Error checking AnkiDroid: ${err}`);
    }
  };

  const handleRequestPermission = async () => {
    try {
      // Clear any existing errors when starting permission request
      setError("");
      
      const result = await requestPermission();
      
      if (result.granted) {
        // Permission granted - re-check status
        await checkConnection();
      } else if (result.granted === false) {
        // Only show error if explicitly denied (not cancelled/dismissed)
        setError(
          "Permission denied. Please grant permission to access AnkiDroid."
        );
      }
      // If result.granted is undefined/null, user likely dismissed dialog - don't show error
    } catch (err) {
      // Only show error for actual errors, not user cancellations
      const errorMessage = `${err}`;
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('dismissed')) {
        setError(`Error requesting permission: ${err}`);
      }
    }
  };

  // Automatically check AnkiDroid when provider mounts
  useEffect(() => {
    checkConnection();
  }, []);

  const value: AnkiContextValue = {
    status,
    isConnected: status?.available || false,
    error,
    requestPermission: handleRequestPermission,
    checkConnection,
  };

  return (
    <AnkiContext.Provider value={value}>
      {children}
    </AnkiContext.Provider>
  );
}

export function useAnkiContext() {
  const context = useContext(AnkiContext);
  if (!context) {
    throw new Error("useAnkiContext must be used within AnkiProvider");
  }
  return context;
}