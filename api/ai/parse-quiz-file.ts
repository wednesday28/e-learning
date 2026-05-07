import type { VercelRequest, VercelResponse } from '@vercel/node';
import mammoth from 'mammoth';

// Polyfills
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
    
    // API Keys Rotation Logic
    const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    const cerebrasKeys = (process.env.CEREBRAS_API_KEYS || process.env.CEREBRAS_API_KEY || '').split(',').filter(Boolean);
    const useCerebras = cerebrasKeys.length > 0;
    const cerebrasKey = useCerebras ? cerebrasKeys[Math.floor(Math.random() * cerebrasKeys.length)] : null;

    // Preference: Groq (more stable) -> Cerebras
    const apiKey = groqApiKey || cerebrasKey;
    const apiUrl = groqApiKey ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.cerebras.ai/v1/chat/completions';
    const model = groqApiKey ? 'llama-3.3-70b-versatile' : 'llama3.1-8b';

    if (!apiKey) {
      return res.status(500).json({ message: 'Konfigurasi AI (API Key) tidak ditemukan di server.' });
    }

    let extractedText = '';
    let parseError = '';

    if (fileUrl) {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`Download file gagal: ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      const lowerName = fileName?.toLowerCase() || '';

      if (fileType?.includes('pdf') || lowerName.endsWith('.pdf')) {
        try {
          const { createRequire } = await import('node:module');
          const require = createRequire(import.meta.url);
          const pdfLib = require('pdf-parse');
          const data = await pdfLib(buffer);
          extractedText = data.text || '';
        } catch (pdfErr: any) {
          console.error('PDF Parse Error:', pdfErr);
          parseError = `[PDF Error: ${pdfErr.message}]`;
        }
      } else if (fileType?.includes('word') || lowerName.endsWith('.docx')) {
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || '';
        } catch (wordErr: any) {
          parseError = `[Word Error: ${wordErr.message}]`;
        }
      } else {
        extractedText = buffer.toString('utf-8');
      }
    }

    if (!extractedText && !topic) {
      return res.status(400).json({ message: `Gagal mengekstrak materi. ${parseError}` });
    }

    // AI Generation
    const prompt = `Buatkan ${questionCount} soal kuis pilihan ganda (A,B,C,D) tentang ${topic || 'materi ini'}.
    Mata Pelajaran: ${subject || 'Umum'}
    PENTING: Hanya berikan output JSON array murni.
    Format JSON: [{"question_text":"...","choices":[{"text":"A. ...","is_correct":true},...]}]
    
    MATERI REFERENSI:
    ${extractedText.substring(0, 15000)}`;

    const aiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'AI API Error');

    const content = aiData.choices[0]?.message?.content || '';
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch (jsonErr) {
      // Try to find JSON array in the text
      const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) questions = JSON.parse(match[1]);
      else throw new Error('AI tidak menghasilkan format JSON yang valid.');
    }

    return res.status(200).json({ questions });

  } catch (error: any) {
    console.error('Final Handler Error:', error);
    return res.status(500).json({ 
      message: 'Gagal membuat kuis', 
      detail: error.message 
    });
  }
}
