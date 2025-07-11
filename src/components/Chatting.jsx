import { useState } from "react";

export function Chatting() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: input },
          ],
          temperature: 0.7,
          max_tokens: 100,
          stream: true,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n");

        // Keep last incomplete line in buffer
        buffer = lines.pop();

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === "" || trimmedLine === "data: [DONE]") continue;

          try {
            const json = JSON.parse(trimmedLine.replace(/^data:\s*/, ""));
            const token = json.choices?.[0]?.delta?.content;
            if (token) {
              setResponse((prev) => prev + token);
            }
          } catch (err) {
            console.error("Failed to parse stream chunk:", err);
          }
        }
      }
    } catch (err) {
      console.error("OpenAI API error:", err);
      setResponse("❌ Failed to get response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">💬 Ask AI</h1>

        <textarea
          className="w-full border border-gray-300 rounded p-3 mb-4"
          rows={4}
          placeholder="Type your message to the AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={handleClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Streaming..." : "Ask"}
        </button>

        <div className="mt-6 border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <div className="whitespace-pre-wrap text-gray-800 min-h-[50px]">
            {response || (loading && "...")}
          </div>
        </div>
      </div>
    </div>
  );
}
