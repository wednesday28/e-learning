import type { VercelRequest, VercelResponse } from '@vercel/node';
import mammoth from 'mammoth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let pdf: any;
try {
  pdf = require('pdf-parse');
} catch (e) {
  console.error('Failed to load pdf-parse via createRequire:', e);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileUrl, fileName, fileType, topic, questionCount = 5 } = req.body;
  const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(500).json({ message: 'API Key AI tidak ditemukan.' });
  }

  console.log('Processing Quiz Gen:', { fileName, fileType, topic, hasUrl: !!fileUrl });

  try {
    let extractedText = '';
    let parseError = '';

    if (fileUrl) {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Gagal download file (Status: ${response.status})`);
        
        const buffer = Buffer.from(await response.arrayBuffer());
        const lowerName = fileName?.toLowerCase() || '';

        if (fileType?.includes('pdf') || lowerName.endsWith('.pdf')) {
          if (pdf) {
            console.log('Parsing PDF...');
            const data = await pdf(buffer);
            extractedText = data.text || '';
            console.log('PDF Extracted text length:', extractedText.length);
          } else {
             parseError = 'Library PDF tidak tersedia di server.';
          }
        } else if (fileType?.includes('word') || lowerName.endsWith('.docx')) {
          console.log('Parsing Word...');
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || '';
        } else if (fileType?.includes('text') || lowerName.endsWith('.txt')) {
          extractedText = buffer.toString('utf-8');
        }
      } catch (err: any) {
        console.error('File parsing detailed error:', err);
        parseError = err.message;
      }
    }

    let prompt = '';
    const formatInstruction = `Format wajib JSON array murni tanpa markdown. 
      PENTING: Harus berupa pilihan ganda dengan TEPAT 4 pilihan (A, B, C, D).
      [
        {
          "question_text": "...",
          "difficulty_level": "medium",
          "choices": [
            {"text": "Jawaban A", "is_correct": true},
            {"text": "Jawaban B", "is_correct": false},
            {"text": "Jawaban C", "is_correct": false},
            {"text": "Jawaban D", "is_correct": false}
          ]
        }
      ]`;

    if (extractedText && extractedText.trim().length > 20) {
      prompt = `Buatkan ${questionCount} soal pilihan ganda (A/B/C/D) berdasarkan teks berikut. 
      Judul Kuis: "${topic}"
      
      ${formatInstruction}

      TEKS MATERI:
      ${extractedText.substring(0, 7000)}`;
    } else if (topic) {
      console.log('Falling back to topic-based generation');
      prompt = `Buatkan ${questionCount} soal kuis pilihan ganda (A/B/C/D) tentang topik: "${topic}".
      ${formatInstruction}`;
    } else {
      return res.status(400).json({ 
        message: `Gagal mengekstrak teks dari file. ${parseError ? `Detail: ${parseError}` : 'File mungkin kosong atau tidak terbaca.'} Pastikan file PDF bukan hasil scan gambar.` 
      });
    }

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
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'Gagal memanggil Groq AI');

    const content = aiData.choices[0]?.message?.content || '';
    if (!content) throw new Error('AI tidak memberikan respon teks.');

    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let questions;
    try {
      questions = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('JSON Parse Error. Content:', cleanedContent);
      throw new Error('Respon AI bukan format JSON yang valid.');
    }

    return res.status(200).json({ questions });

  } catch (error: any) {
    console.error('Final API Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan: ' + error.message });
  }
}
