import type { VercelRequest, VercelResponse } from '@vercel/node';
import mammoth from 'mammoth';

// Use require for pdf-parse to avoid ESM default export issues in Vercel
let pdf: any;
try {
  pdf = require('pdf-parse');
} catch (e) {
  console.error('Failed to load pdf-parse:', e);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Ensure we always return JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileUrl, fileName, fileType, topic } = req.body;
  const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(500).json({ message: 'API Key AI (GROQ_API_KEY) tidak ditemukan di environment server. Pastikan sudah ditambahkan di Vercel Dashboard.' });
  }

  try {
    let extractedText = '';

    // 1. If fileUrl is provided, try to parse it
    if (fileUrl) {
      try {
        console.log('Fetching file from URL:', fileUrl);
        const response = await fetch(fileUrl);
        if (!response.ok) {
           throw new Error(`Gagal mendownload file: ${response.statusText}`);
        }
        
        const buffer = Buffer.from(await response.arrayBuffer());
        const lowerName = fileName?.toLowerCase() || '';

        if (fileType === 'application/pdf' || lowerName.endsWith('.pdf')) {
          if (!pdf) throw new Error('Library pdf-parse tidak termuat dengan benar.');
          const data = await pdf(buffer);
          extractedText = data.text;
        } else if (
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          lowerName.endsWith('.docx')
        ) {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } else if (fileType === 'text/plain' || lowerName.endsWith('.txt')) {
          extractedText = buffer.toString('utf-8');
        }
      } catch (err: any) {
        console.warn('File parsing failed:', err.message);
        // We continue to topic-based generation if parsing fails
      }
    }

    // 2. Prepare Prompt
    let prompt = '';
    if (extractedText && extractedText.trim().length > 50) {
      console.log('Extracted text length:', extractedText.length);
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
      console.log('Using topic for generation:', topic);
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
      return res.status(400).json({ message: 'Tidak ada teks yang dapat diekstrak dan tidak ada topik kuis yang diberikan.' });
    }

    // 3. Call AI (Groq)
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
       console.error('Groq AI Error:', aiData);
       throw new Error(aiData.error?.message || 'Gagal mendapatkan respon dari AI Groq.');
    }

    const content = aiData.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI tidak memberikan jawaban yang valid.');
    }

    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    let questions;
    try {
      questions = JSON.parse(cleanedContent);
    } catch (parseErr) {
      console.error('JSON Parse Error from AI:', cleanedContent);
      throw new Error('Hasil AI bukan format JSON yang valid.');
    }

    return res.status(200).json({ questions });

  } catch (error: any) {
    console.error('Final API Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan internal: ' + error.message });
  }
}
