import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function GreetTab() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div>
      <h2 className="text-xl mb-3">Greet Test</h2>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium"
        >
          Greet
        </button>
      </form>
      {greetMsg && (
        <p className="mt-3 text-center text-gray-700">{greetMsg}</p>
      )}
    </div>
  );
}