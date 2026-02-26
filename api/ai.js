export default async function handler(req, res) {
  // Set CORS biar aman
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Cuma terima method GET
  if (req.method !== "GET") {
    return res.status(405).json({ 
      error: "Method not allowed",
      message: "Cuma method GET yang diterima" 
    });
  }

  try {
    // Ambil prompt dari query parameter, default "hi"
    const prompt = req.query.prompt || "hi";
    
    console.log("📨 Prompt diterima:", prompt);

    // Fetch ke API eksternal (pake fetch native, ga perlu node-fetch)
    const response = await fetch(
      `https://magma-api.biz.id/ai/copilot?prompt=${encodeURIComponent(prompt)}`,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Vercel-Serverless-Function"
        }
      }
    );

    // Cek response dari API eksternal
    if (!response.ok) {
      throw new Error(`API Eksternal error: ${response.status} ${response.statusText}`);
    }

    // Parse JSON response
    const data = await response.json();
    
    console.log("✅ Response dari API:", data.status ? "Sukses" : "Gagal");

    // Kirim balik ke frontend
    return res.status(200).json(data);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    // Kirim error ke frontend
    return res.status(500).json({ 
      error: "Backend error",
      message: error.message,
      hint: "Cek logs di Vercel dashboard"
    });
  }
}