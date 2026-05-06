import type { VercelRequest, VercelResponse } from '@vercel/node';
import mammoth from 'mammoth';

// Use require for pdf-parse to avoid ESM default export issues in Vercel
const pdf = require('pdf-parse');

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileUrl, fileName, fileType, topic } = req.body;
  const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(500).json({ message: 'API Key AI (GROQ_API_KEY) tidak ditemukan di environment server.' });
  }

  try {
    let extractedText = '';

    // 1. If fileUrl is provided, try to parse it
    if (fileUrl) {
      try {
        const response = await fetch(fileUrl);
        const buffer = Buffer.from(await response.arrayBuffer());

        if (fileType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf')) {
          const data = await pdf(buffer);
          extractedText = data.text;
        } else if (
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          fileName?.toLowerCase().endsWith('.docx')
        ) {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } else if (fileType === 'text/plain' || fileName?.toLowerCase().endsWith('.txt')) {
          extractedText = buffer.toString('utf-8');
        }
      } catch (err) {
        console.warn('Failed to parse file, will fallback to topic-based generation', err);
      }
    }

    // 2. Prepare Prompt
    let prompt = '';
    if (extractedText && extractedText.trim().length > 100) {
      prompt = `Analisis teks berikut dan ekstrak pertanyaan pilihan ganda untuk kuis. 
      Buat minimal 5-10 soal jika memungkinkan.
      Format wajib JSON array murni tanpa markdown:
      [
        {
          "question_text": "Pertanyaan",
          "difficulty_level": "medium",
          "type": "multiple_choice",
          "choices": [
            {"text": "Opsi A", "is_correct": true},
            {"text": "Opsi B", "is_correct": false},
            {"text": "Opsi C", "is_correct": false},
            {"text": "Opsi D", "is_correct": false}
          ]
        }
      ]

      TEKS MATERI:
      ${extractedText.substring(0, 6000)}`;
    } else if (topic) {
      prompt = `Buatkan 5 soal kuis pilihan ganda tentang topik: "${topic}".
      Format wajib JSON array murni tanpa markdown:
      [
        {
          "question_text": "Pertanyaan",
          "difficulty_level": "medium",
          "type": "multiple_choice",
          "choices": [
            {"text": "Opsi A", "is_correct": true},
            {"text": "Opsi B", "is_correct": false},
            {"text": "Opsi C", "is_correct": false},
            {"text": "Opsi D", "is_correct": false}
          ]
        }
      ]`;
    } else {
      return res.status(400).json({ message: 'Tidak ada teks yang diekstrak dan tidak ada topik yang diberikan.' });
    }

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
        temperature: 0.3
      })
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) {
       throw new Error(aiData.error?.message || 'Gagal memanggil AI');
    }

    const content = aiData.choices[0].message.content;
    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions = JSON.parse(cleanedContent);

    res.status(200).json({ questions });

  } catch (error: any) {
    console.error('AI Quiz Gen Error:', error);
    res.status(500).json({ message: 'Error: ' + error.message });
  }
}
