// api/analyze.js
// Bu kod Vercel sunucusunda çalışır, tarayıcıda değil.

export default async function handler(req, res) {
  // CORS Ayarları (Tarayıcıdan gelen isteğe izin ver)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Güvenlik için '*' yerine kendi domainini yazabilirsin ama hackathon için '*' kalsın.
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS isteği (Ön kontrol) gelirse hemen OK dön
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Sadece POST isteği kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server API Key eksik.' });
  }

  const { code } = req.body;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are an expert in Sui Move. Convert code to JSON for React Flow.
            RULES:
            1. Return ONLY valid JSON.
            2. Identify 'struct' -> type='structNode'.
            3. Identify 'fun' -> type='functionNode'.
            4. Layout: Structs x:100, Functions x:600.`
          },
          {
            role: "user",
            content: `Analyze code:\n\n${code}`
          }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'DeepSeek Hatası' });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}