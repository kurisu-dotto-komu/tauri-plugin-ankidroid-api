import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  isAnkiDroidAvailable,
  getNotes,
  requestPermission,
  NotSupportedError,
} from "ankidroid-api-client";
import type { AnkiDroidStatus, Note } from "ankidroid-api-client";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [ankiStatus, setAnkiStatus] = useState<AnkiDroidStatus | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [ankiError, setAnkiError] = useState<string>("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  async function checkAnkiDroid() {
    try {
      console.log("User Agent:", navigator.userAgent);
      console.log("Is Android check:", navigator.userAgent.includes("Android"));
      const status = await isAnkiDroidAvailable();
      setAnkiStatus(status);
      setAnkiError("");
    } catch (error) {
      setAnkiError(`Error checking AnkiDroid: ${error}`);
    }
  }

  async function handleRequestPermission() {
    try {
      const result = await requestPermission();
      if (result.granted) {
        setAnkiError("");
        // Re-check status after permission grant
        await checkAnkiDroid();
      } else {
        setAnkiError("Permission denied. Please grant permission to access AnkiDroid.");
      }
    } catch (error) {
      setAnkiError(`Error requesting permission: ${error}`);
    }
  }

  async function fetchNotes() {
    try {
      const fetchedNotes = await getNotes({ limit: 10 });
      setNotes(fetchedNotes);
      setAnkiError("");
    } catch (error) {
      if (error instanceof NotSupportedError) {
        setAnkiError("AnkiDroid API is not supported on this platform");
      } else if (error instanceof Error && error.message.includes("Permission not granted")) {
        setAnkiError("Permission not granted. Please grant permission to access AnkiDroid.");
      } else {
        setAnkiError(`Error fetching notes: ${error}`);
      }
    }
  }

  return (
    <main className="container" style={{ marginBottom: "100px" }}>
      <h1>Ankidroid API Test</h1>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>

      <hr style={{ margin: "20px 0" }} />

      <h2>AnkiDroid API Test</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
        <button onClick={checkAnkiDroid}>Check AnkiDroid</button>
        <button onClick={handleRequestPermission}>Request Permission</button>
        <button onClick={fetchNotes} disabled={!ankiStatus?.available}>
          Get Notes (limit: 10)
        </button>
      </div>

      {ankiStatus && (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <h3>AnkiDroid Status:</h3>
          <ul>
            <li>Installed: {ankiStatus.installed ? "Yes" : "No"}</li>
            <li>Has Permission: {ankiStatus.hasPermission ? "Yes" : "No"}</li>
            <li>
              Provider Reachable: {ankiStatus.providerReachable ? "Yes" : "No"}
            </li>
            <li>Available: {ankiStatus.available ? "Yes" : "No"}</li>
            <li>Version: {ankiStatus.version || "Unknown"}</li>
          </ul>
        </div>
      )}

      {notes.length > 0 && (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <h3>Notes ({notes.length}):</h3>
          {notes.map((note) => {
            const hasTestField = note.fields.some((field) =>
              field.toLowerCase().includes("test")
            );
            return (
              <div
                key={note.id}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  backgroundColor: hasTestField ? "#fffacd" : "transparent",
                }}
              >
                <strong>ID:</strong> {note.id}
                <br />
                <strong>Fields:</strong> {note.fields.join(" | ")}
                <br />
                <strong>Tags:</strong> {note.tags.join(", ") || "None"}
                <br />
                <strong>Sort Field:</strong> {note.sfld}
              </div>
            );
          })}
        </div>
      )}

      {ankiError && (
        <p style={{ color: "red", marginTop: "20px" }}>{ankiError}</p>
      )}
    </main>
  );
}

export default App;
