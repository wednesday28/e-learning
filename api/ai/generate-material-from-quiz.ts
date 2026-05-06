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
  const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(500).json({ message: 'API Key AI tidak ditemukan.' });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Tidak ada soal kuis untuk dijadikan referensi materi.' });
  }

  try {
    // 1. Prepare questions summary
    const questionsSummary = questions.map((q: any, i: number) => {
      const choices = q.choices?.map((c: any) => c.choice_text || c.text).join(', ');
      return `${i + 1}. ${q.question_text} (Opsi: ${choices})`;
    }).join('\n');

    // 2. Prepare AI Prompt
    const prompt = `Berdasarkan kumpulan soal kuis berikut, buatkan materi pembelajaran yang komprehensif, edukatif, dan mudah dipahami.
    Materi harus mencakup penjelasan konsep yang ditanyakan dalam soal-soal tersebut.
    Gunakan format Markdown yang rapi dengan sub-judul, poin-poin, dan penjelasan mendalam.
    
    JUDUL KUIS: ${quizTitle || 'Topik Terkait'}
    
    SOAL-SOAL REFERENSI:
    ${questionsSummary}
    
    Hasilkan materi pembelajaran dalam bahasa Indonesia yang lengkap.`;

    // 3. Call AI
    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'Gagal memanggil AI');

    const generatedMaterial = aiData.choices[0]?.message?.content || '';

    return res.status(200).json({ content: generatedMaterial });

  } catch (error: any) {
    console.error('Material Gen Error:', error);
    return res.status(500).json({ message: 'Gagal membuat materi: ' + error.message });
  }
}
