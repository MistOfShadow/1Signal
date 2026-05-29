if (!process.env.GOOGLE_GEMINI_API_KEY) {
  throw new Error(
    "GOOGLE_GEMINI_API_KEY must be set. Provide a Google Gemini key in the environment.",
  );
}

const KEY = process.env.GOOGLE_GEMINI_API_KEY;

// Minimal Google Gemini wrapper using SSE
async function* callGeminiStream(model: string, messages: any[], maxTokens?: number) {
  let modelName = model || "gemini-2.5-flash";
  if (modelName.includes("gpt") || modelName.includes("gemini-1.5")) {
    modelName = "gemini-2.5-flash";
  }
  if (modelName.startsWith("models/")) {
    modelName = modelName.split("/").pop() || modelName;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:streamGenerateContent?alt=sse&key=${KEY}`;

  const systemMessage = messages.find((m: any) => m.role === "system");
  const otherMessages = messages.filter((m: any) => m.role !== "system");

  const geminiContents = otherMessages.map((m: any) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const body: any = {
    contents: geminiContents
  };

  if (systemMessage) {
    body.systemInstruction = {
      parts: [{ text: systemMessage.content }]
    };
  }

  if (maxTokens) {
    body.generationConfig = {
      maxOutputTokens: maxTokens
    };
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Gemini API error: ${resp.status} ${txt}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) {
    throw new Error("No response body reader available");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      try {
        const json = JSON.parse(dataStr);
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          yield text;
        }
      } catch (e) {
        // ignore parse error of partial lines
      }
    }
  }
}

const googleGemini = {
  chat: {
    completions: {
      create: async (opts: any) => {
        const model = opts.model || process.env.GOOGLE_GEMINI_MODEL || "gemini-2.5-flash";
        const max_completion_tokens = opts.max_completion_tokens || opts.maxOutputTokens || undefined;
        const messages = opts.messages || [];

        const stream = callGeminiStream(model, messages, max_completion_tokens);

        // Return an async iterable that yields choices compatible with standard streaming loop
        return (async function* () {
          for await (const text of stream) {
            yield { choices: [{ delta: { content: text } }] };
          }
        })();
      },
    },
  },
} as const;

export { googleGemini };
