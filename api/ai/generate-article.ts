import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { topic, summary, subject } = req.body

  if (!topic) {
    return res.status(400).json({ message: 'Topik wajib diisi.' })
  }

  const cerebrasApiKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY || 'csk-48rn5nyym4cmkjtj4ttx5cre828h6dncehcf964vcrdt8dnn';
  const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
  const apiKey = cerebrasApiKey || groqApiKey;
  const apiUrl = cerebrasApiKey ? 'https://api.cerebras.ai/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
  const modelName = cerebrasApiKey ? 'llama3.1-8b' : 'llama-3.3-70b-versatile';

  if (!apiKey) {
    return res.status(500).json({ message: 'API Key AI tidak ditemukan.' });
  }

  const systemPrompt = `Anda adalah penulis konten edukasi profesional untuk platform E-Learning. 
Tugas Anda adalah menulis sebuah materi pembelajaran (artikel) yang mendalam, terstruktur dengan sangat baik, dan mudah dipahami oleh siswa.
Materi ini HARUS menggunakan format Markdown yang rapi.

PEDOMAN PENULISAN:
1. Awali dengan Judul utama (H1).
2. Buat struktur yang jelas menggunakan heading (H2, H3), bullet points, atau tabel jika perlu.
3. Gaya bahasa informatif, menarik, dan akademis namun ramah.
4. Gunakan contoh nyata atau analogi untuk mempermudah pemahaman.
5. Sediakan bagian "Kesimpulan" atau "Ringkasan" di akhir artikel.
6. Jika ada ringkasan yang diberikan oleh guru, kembangkan ringkasan tersebut menjadi penjelasan yang komprehensif.
7. Artikel harus berbobot dan minimal terdiri dari 400-600 kata.`;

  const userPrompt = `Tolong buatkan materi pembelajaran komprehensif mengenai:
Topik: ${topic}
${subject ? `Mata Pelajaran: ${subject}` : ''}
${summary ? `Ringkasan/Poin Penting dari Guru: ${summary}` : ''}`;

  try {
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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gagal memanggil AI API');
    }

    const articleContent = data.choices[0]?.message?.content || '';

    if (!articleContent) {
      throw new Error('AI tidak memberikan respon teks.');
    }

    res.status(200).json({ article: articleContent });

  } catch (error: any) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat men-generate materi: ' + error.message });
  }
}
