import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { quizTitle, questions } = req.body;
  
  // API Keys Rotation & Fallback
  const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  const cerebrasKeys = (process.env.CEREBRAS_API_KEYS || process.env.CEREBRAS_API_KEY || '').split(',').filter(Boolean);
  const cerebrasKey = cerebrasKeys.length > 0 ? cerebrasKeys[Math.floor(Math.random() * cerebrasKeys.length)] : null;

  // Preference: Groq (faster/more stable) -> Cerebras
  const apiKey = groqApiKey || cerebrasKey;
  const apiUrl = groqApiKey ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.cerebras.ai/v1/chat/completions';
  const model = groqApiKey ? 'llama-3.3-70b-versatile' : 'llama3.1-8b';

  if (!apiKey) {
    return res.status(500).json({ message: 'AI Configuration error: API Key not found.' });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Tidak ada soal kuis untuk dijadikan referensi materi.' });
  }

  try {
    // 1. Prepare questions summary
    const questionsSummary = questions.map((q: any, i: number) => {
      const choices = (q.choices || []).map((c: any) => c.text || c.choice_text).join(', ');
      return `${i + 1}. ${q.question_text} (Opsi: ${choices})`;
    }).join('\n');

    // 2. Prepare AI Prompt
    const prompt = `Berdasarkan kumpulan soal kuis berikut, buatkan materi pembelajaran yang komprehensif, edukatif, dan mudah dipahami.
    Materi harus mencakup penjelasan konsep yang ditanyakan dalam soal-soal tersebut.
    Gunakan format Markdown yang rapi dengan sub-judul (H2, H3), poin-poin, dan penjelasan mendalam.
    
    JUDUL KUIS: ${quizTitle || 'Topik Terkait'}
    
    SOAL-SOAL REFERENSI:
    ${questionsSummary.substring(0, 10000)}
    
    Hasilkan materi pembelajaran dalam bahasa Indonesia yang lengkap. Berikan penjelasan teoritis untuk setiap topik yang disentuh oleh soal tersebut.`;

    // 3. Call AI
    const aiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) {
      const errorMsg = aiData.error?.message || aiData.message || 'AI API Error';
      throw new Error(`AI Provider Error: ${errorMsg}`);
    }

    const generatedMaterial = aiData.choices[0]?.message?.content || '';

    return res.status(200).json({ content: generatedMaterial });

  } catch (error: any) {
    console.error('Material Gen Error:', error);
    return res.status(500).json({ message: 'Gagal membuat materi: ' + error.message });
  }
}
