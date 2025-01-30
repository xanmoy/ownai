"use client"
import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-r1:1.5b",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Response body is null");
      }
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });

        // Try to extract "message" content safely
        try {
          const jsonChunks = result.trim().split("\n").map(chunk => JSON.parse(chunk));
          const messages = jsonChunks.map(chunk => chunk.message?.content).join("");
          setResponse(messages);
        } catch {
          console.warn("Waiting for complete JSON chunks...");
        }
      }
    } catch (error) {
      setResponse("Error: " + (error instanceof Error ? error.message : "Unknown error"));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">OwnAI Chat</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="w-full p-2 rounded bg-neutral-800 text-white"
        />
        <button
          type="submit"
          className="mt-2 w-full p-2 bg-indigo-500 text-white rounded"
          disabled={loading}
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>
      {response && (
        <div className="mt-4 p-4 rounded w-full max-w-4xl bg-neutral-700">
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}