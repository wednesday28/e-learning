import type { VercelRequest, VercelResponse } from '@vercel/node';
import mammoth from 'mammoth';

// Extremely resilient polyfill
if (typeof global !== 'undefined') {
  try {
    if (!(global as any).DOMMatrix) (global as any).DOMMatrix = class {};
    if (!(global as any).DOMPoint) (global as any).DOMPoint = class {};
    if (!(global as any).DOMRect) (global as any).DOMRect = class {};
  } catch (e) {}
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    const { fileUrl, fileName, fileType, topic, questionCount = 5, subject = '' } = req.body;
    const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

    let extractedText = '';
    let parseError = '';

    if (fileUrl) {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`Download file gagal: ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      const lowerName = fileName?.toLowerCase() || '';

      if (fileType?.includes('pdf') || lowerName.endsWith('.pdf')) {
        try {
          // Dynamic import with full resolution logic
          const pdfMod: any = await import('pdf-parse/lib/pdf-parse.js');
          const pdf = pdfMod.default || pdfMod;
          
          if (typeof pdf === 'function') {
            const data = await pdf(buffer);
            extractedText = data.text || '';
          } else {
            // Last resort: try require if available
            try {
              const { createRequire } = await import('module');
              const require = createRequire(import.meta.url);
              const pdfLib = require('pdf-parse');
              const data = await pdfLib(buffer);
              extractedText = data.text || '';
            } catch (e) {
              throw new Error('PDF parser could not be initialized as a function');
            }
          }
        } catch (pdfErr: any) {
          console.error('PDF Final Error:', pdfErr);
          parseError = `PDF Error: ${pdfErr.message}. Silakan gunakan file Word (.docx) atau tuliskan topik kuis di kolom yang tersedia.`;
        }
      } else if (fileType?.includes('word') || lowerName.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || '';
      } else {
        extractedText = buffer.toString('utf-8');
      }
    }

    if (!extractedText && !topic) {
      return res.status(400).json({ message: parseError || 'Gagal mengekstrak materi.' });
    }

    // AI Generation
    const prompt = `Buatkan ${questionCount} soal kuis pilihan ganda (A,B,C,D) tentang ${topic || 'materi ini'}.
    Mata Pelajaran: ${subject || 'Umum'}
    Format JSON: [{"question_text":"...","choices":[{"text":"A. ...","is_correct":true},...]}]
    MATERI: ${extractedText.substring(0, 15000)}`;

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
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'AI Error');

    const content = aiData.choices[0]?.message?.content || '';
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions = JSON.parse(cleaned);

    return res.status(200).json({ questions });

  } catch (error: any) {
    console.error('Final Handler Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan sistem', detail: error.message });
  }
}
