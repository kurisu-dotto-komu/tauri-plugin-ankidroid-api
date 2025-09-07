import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function GreetTab() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke<string>("greet", { name }));
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Tauri!</h1>

      <div className="flex gap-2 mb-4">
        <input
          id="greet-input"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
          value={name}
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="button"
          onClick={() => greet()}
        >
          Greet
        </button>
      </div>

      {greetMsg && (
        <p className="text-lg text-gray-700">{greetMsg}</p>
      )}
    </div>
  );
}