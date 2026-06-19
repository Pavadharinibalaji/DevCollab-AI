async function testGemini() {
  const url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  const apiKey = "dummy-key";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gemini-1.5-flash",
      messages: [{ role: "user", content: "hello" }],
    }),
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
testGemini();
