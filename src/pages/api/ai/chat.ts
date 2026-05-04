import type { NextApiRequest, NextApiResponse } from 'next'

// Note: In a real production environment, this would call OpenAI API
// using an API key stored in environment variables.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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
6. Anda memiliki pengetahuan luas tentang Kurikulum Merdeka (SD, SMP, SMA, SMK).`

    // MOCK RESPONSE FOR DEMO
    // In production, replace with:
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      })
    });
    const data = await response.json();
    return res.status(200).json({ reply: data.choices[0].message.content });
    */

    // Simulated AI response logic
    let reply = `Halo! Sebagai AI Guru Anda, saya mengerti pertanyaan Anda tentang ${subject || 'topik ini'}. `
    
    if (message.toLowerCase().includes('jelaskan')) {
      reply += `Materi ini sangat penting di Kelas ${grade}. Secara ringkas, fokus utamanya adalah pemahaman konsep dasar dan penerapannya dalam kehidupan sehari-hari.`
    } else if (message.toLowerCase().includes('contoh soal')) {
      reply += `Tentu! Berikut adalah contoh soal sederhana: "Bagaimana penerapan konsep ${subject} dalam menjaga kelestarian lingkungan?" Coba Anda pikirkan jawabannya dahulu.`
    } else {
      reply += `Pertanyaan yang bagus! Mari kita diskusikan lebih lanjut. Apakah ada bagian spesifik dari ${subject} yang membuat Anda bingung?`
    }

    res.status(200).json({ 
      reply,
      tokens_used: 150 
    })

  } catch (error) {
    console.error('AI Chat Error:', error)
    res.status(500).json({ 
      reply: 'Maaf, saya sedang mengalami gangguan teknis. Mari kita coba lagi sebentar lagi.',
      error: true 
    })
  }
}
