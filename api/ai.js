import fetch from "node-fetch";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prompt = req.query.prompt || "hi";
    
    console.log(`[AI Request] Prompt: ${prompt}`);

    // Fetch ke API eksternal
    const response = await fetch(
      `https://magma-api.biz.id/ai/copilot?prompt=${encodeURIComponent(prompt)}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Vercel-Serverless-Function'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API external error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`[AI Response] Status: ${data.status}`);
    
    // Kirim response
    return res.status(200).json(data);
    
  } catch (err) {
    console.error(`[AI Error] ${err.message}`);
    return res.status(500).json({ 
      error: "Backend lo yang error", 
      detail: err.message 
    });
  }
}