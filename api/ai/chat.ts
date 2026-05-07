import type { VercelRequest, VercelResponse } from '@vercel/node'

// Note: In a real production environment, this would call OpenAI API
// using an API key stored in environment variables.

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { message, subject, grade, lessonId, content } = req.body

  try {
    // SYSTEM PROMPT CONSTRUCTION
    const systemPrompt = `Anda adalah AI Guru (AI Tutor) untuk platform e-learning "Kurikulum Merdeka".
Tugas Anda adalah membantu siswa memahami materi pelajaran dengan cara yang sabar, edukatif, dan memotivasi.

KONTEKS SAAT INI:
- Mata Pelajaran: ${subject || 'Umum'}
- Kelas: ${grade || 'Semua Kelas'}
- Materi ID: ${lessonId || 'Tidak spesifik'}
${content ? `- Konten Materi: ${content.substring(0, 500)}...` : ''}

PEDOMAN JAWABAN:
1. Gunakan Bahasa Indonesia yang baik, benar, dan ramah (semi-formal).
2. Jika siswa bertanya hal di luar pelajaran, arahkan kembali ke materi dengan sopan.
3. Berikan penjelasan yang mendalam namun mudah dimengerti.
4. Gunakan contoh-contoh nyata jika memungkinkan.
5. Jika ditanya soal latihan, berikan langkah-langkah pengerjaannya, jangan langsung jawabannya.
6. Anda memiliki pengetahuan luas tentang Kurikulum Merdeka (SD, SMP, SMA, SMK).
7. JIKA PENGGUNA (GURU) MEMINTA DIBUATKAN SOAL KUIS UNTUK DISIMPAN:
Anda HANYA boleh membalas dengan format JSON murni diapit oleh tag \`\`\`json dan \`\`\`. Format wajib:
\`\`\`json
[
  {
    "question_text": "...",
    "difficulty_level": "medium",
    "choices": [
      {"text": "A. ...", "is_correct": true},
      {"text": "B. ...", "is_correct": false},
      {"text": "C. ...", "is_correct": false},
      {"text": "D. ...", "is_correct": false}
    ]
  }
]
\`\`\`
Jangan tambahkan teks pengantar apapun selain JSON di atas jika diminta membuat soal kuis.`

    const cerebrasApiKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY || 'csk-48rn5nyym4cmkjtj4ttx5cre828h6dncehcf964vcrdt8dnn';
    const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    const apiKey = cerebrasApiKey || groqApiKey;
    const apiUrl = cerebrasApiKey ? 'https://api.cerebras.ai/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
    const modelName = cerebrasApiKey ? 'llama3.1-8b' : 'llama-3.3-70b-versatile';

    if (!apiKey) {
      return res.status(500).json({ reply: 'API Key AI tidak ditemukan.', error: true });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal memanggil AI API');
    }

    res.status(200).json({ 
      reply: data.choices[0]?.message?.content || 'Maaf, saya tidak dapat menghasilkan respon.',
      tokens_used: data.usage?.total_tokens || 0 
    })

  } catch (error: any) {
    console.error('AI Chat Error:', error)
    res.status(500).json({ 
      reply: 'Maaf, saya sedang mengalami gangguan teknis. Detail: ' + error.message,
      error: true 
    })
  }
}
