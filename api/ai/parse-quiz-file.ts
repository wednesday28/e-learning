import type { VercelRequest, VercelResponse } from '@vercel/node';
import mammoth from 'mammoth';
// @ts-ignore
import pdfModule from 'pdf-parse';

// Polyfill for pdf-parse in Node environments (Vercel)
if (typeof global !== 'undefined') {
  if (!(global as any).DOMMatrix) (global as any).DOMMatrix = class {};
  if (!(global as any).DOMPoint) (global as any).DOMPoint = class {};
  if (!(global as any).DOMRect) (global as any).DOMRect = class {};
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { fileUrl, fileName, fileType, topic, questionCount = 5, subject = '' } = req.body;
    
    const cerebrasApiKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY || 'csk-48rn5nyym4cmkjtj4ttx5cre828h6dncehcf964vcrdt8dnn';
    const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

    let extractedText = '';
    let parseError = '';

    if (fileUrl) {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Gagal download file: ${response.status}`);
        
        const buffer = Buffer.from(await response.arrayBuffer());
        const lowerName = fileName?.toLowerCase() || '';

        if (fileType?.includes('pdf') || lowerName.endsWith('.pdf')) {
          try {
            // Robust resolver for pdf-parse
            const pdf = (pdfModule as any).default || pdfModule;
            
            if (typeof pdf === 'function') {
              const data = await pdf(buffer);
              extractedText = data.text || '';
            } else {
              throw new Error(`PDF library type is ${typeof pdf}`);
            }
          } catch (pdfErr: any) {
            console.error('PDF Parse Error:', pdfErr);
            parseError = `Gagal memproses PDF: ${pdfErr.message}`;
          }
        } else if (fileType?.includes('word') || lowerName.endsWith('.docx')) {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || '';
        } else if (fileType?.includes('text') || lowerName.endsWith('.txt')) {
          extractedText = buffer.toString('utf-8');
        }
      } catch (err: any) {
        parseError = err.message;
      }
    }

    if (!extractedText && !topic) {
      return res.status(400).json({ 
        message: `Gagal mengekstrak materi. ${parseError}` 
      });
    }

    const prompt = `Buatkan ${questionCount} soal pilihan ganda (A,B,C,D) tentang ${topic || 'materi ini'}.
    Mata Pelajaran: ${subject || 'Umum'}
    
    Format JSON:
    [{"question_text":"...","choices":[{"text":"A. ...","is_correct":true},...]}]
    
    ISI MATERI:
    ${extractedText.substring(0, 20000)}`;

    const apiKey = groqApiKey || cerebrasApiKey;
    const apiUrl = groqApiKey ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.cerebras.ai/v1/chat/completions';
    const model = groqApiKey ? 'llama-3.3-70b-versatile' : 'llama3.1-8b';

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
    const questions = JSON.parse(cleaned);

    return res.status(200).json({ questions });

  } catch (error: any) {
    console.error('Handler Error:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error',
      detail: error.message 
    });
  }
}
