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

  const { fileUrl, fileName, fileType, topic, questionCount = 5 } = req.body;
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
        if (!response.ok) throw new Error(`Gagal download: ${response.statusText}`);
        
        const buffer = Buffer.from(await response.arrayBuffer());
        const lowerName = fileName?.toLowerCase() || '';

        if (fileType === 'application/pdf' || lowerName.endsWith('.pdf')) {
          if (pdf) {
            const data = await pdf(buffer);
            extractedText = data.text;
          }
        } else if (fileType?.includes('word') || lowerName.endsWith('.docx')) {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } else if (fileType?.includes('text') || lowerName.endsWith('.txt')) {
          extractedText = buffer.toString('utf-8');
        }
      } catch (err) {
        console.warn('File parsing failed, fallback to topic', err);
      }
    }

    // 2. Prepare Prompt
    let prompt = '';
    const formatInstruction = `Format wajib JSON array murni tanpa markdown:
      [
        {
          "question_text": "...",
          "difficulty_level": "medium",
          "choices": [
            {"text": "...", "is_correct": true},
            {"text": "...", "is_correct": false},
            {"text": "...", "is_correct": false},
            {"text": "...", "is_correct": false}
          ]
        }
      ]`;

    if (extractedText && extractedText.trim().length > 50) {
      prompt = `Buatkan ${questionCount} soal pilihan ganda dari teks berikut. 
      ${formatInstruction}

      TEKS MATERI:
      ${extractedText.substring(0, 6000)}`;
    } else if (topic) {
      prompt = `Buatkan ${questionCount} soal kuis pilihan ganda tentang topik: "${topic}".
      ${formatInstruction}`;
    } else {
      return res.status(400).json({ message: 'Tidak ada sumber materi.' });
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
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'AI Error');

    const content = aiData.choices[0]?.message?.content || '';
    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions = JSON.parse(cleanedContent);

    return res.status(200).json({ questions });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Error: ' + error.message });
  }
}
