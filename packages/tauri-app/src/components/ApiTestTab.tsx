import { useState } from "react";
import { getNotes, NotSupportedError } from "ankidroid-api-client";
import type { Note } from "ankidroid-api-client";
import { useAnkiContext } from "../contexts/AnkiContext";

export default function ApiTestTab() {
  const { status, requestPermission } = useAnkiContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string>("");

  async function fetchNotes() {
    console.log("🔍 fetchNotes called");
    try {
      console.log("📡 Calling getNotes with limit 10...");
      const fetchedNotes = await getNotes({ limit: 10 });
      console.log(
        "✅ getNotes successful, received",
        fetchedNotes.length,
        "notes"
      );
      setNotes(fetchedNotes);
      setError("");
    } catch (err) {
      console.log("❌ Error in fetchNotes:", err);
      if (err instanceof NotSupportedError) {
        console.log("🚫 NotSupportedError detected");
        setError("AnkiDroid API is not supported on this platform");
      } else if (
        err instanceof Error &&
        err.message.includes("Permission not granted")
      ) {
        console.log("🔒 Permission error detected");
        setError(
          "Permission not granted. Please grant permission to access AnkiDroid."
        );
      } else {
        console.log("💥 General error:", err);
        setError(`Error fetching notes: ${err}`);
      }
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">API Test</h2>

      <div className="space-y-2 mb-4">
        {status && !status.hasPermission && (
          <button
            onClick={requestPermission}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium"
          >
            Request Permission
          </button>
        )}
        {status?.hasPermission && (
          <button
            onClick={fetchNotes}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium"
          >
            Get Notes (limit: 10)
          </button>
        )}
      </div>

      {notes.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-2">
            Notes ({notes.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notes.map((note) => {
              const hasTestField = note.fields.some((field) =>
                field.toLowerCase().includes("test")
              );
              return (
                <div
                  key={note.id}
                  className={`p-3 border rounded-lg text-sm ${
                    hasTestField
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    ID: {note.id}
                  </div>
                  <div className="font-medium mb-1">{note.fields[0]}</div>
                  {note.fields.length > 1 && (
                    <div className="text-gray-600">
                      {note.fields.slice(1).join(" | ")}
                    </div>
                  )}
                  {note.tags.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      Tags: {note.tags.join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}