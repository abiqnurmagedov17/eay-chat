export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { prompt, sessionId } = req.query;
  if (!prompt) return res.status(400).json({ error: "Prompt kosong!" });

  const sId = sessionId || "global_session";

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return res.status(500).json({
      error: "ENV belum diset",
      message: "Redis env belum dikonfigurasi"
    });
  }

  try {
    const getHistory = await fetch(`${redisUrl}/get/chat:${sId}`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });

    const historyData = await getHistory.json();
    let history = historyData.result
      ? JSON.parse(historyData.result)
      : [];

    const context = history
      .map(m => `${m.role}: ${m.content}`)
      .join("\n");

    const finalPrompt = context
      ? `Lanjutkan percakapan ini.\n${context}\nUser: ${prompt}\nAI:`
      : prompt;

    const aiRes = await fetch(
      `https://magma-api.biz.id/ai/copilot?prompt=${encodeURIComponent(finalPrompt)}`
    );

    const data = await aiRes.json();
    const botReply =
      data?.result?.response ||
      data?.result ||
      data?.text ||
      "AI lagi males jawab.";

    history.push({ role: "User", content: prompt });
    history.push({ role: "AI", content: botReply });

    const updatedHistory = JSON.stringify(history.slice(-10));

    await fetch(`${redisUrl}/set/chat:${sId}?ex=86400`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json"
      },
      body: updatedHistory
    });

    return res.status(200).json({ result: botReply });

  } catch (err) {
    return res.status(500).json({
      error: "Brutal Error!",
      message: err.message
    });
  }
}