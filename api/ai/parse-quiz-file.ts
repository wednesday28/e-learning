import type { VercelRequest, VercelResponse } from '@vercel/node';
import mammoth from 'mammoth';
// @ts-ignore
import * as pdf from 'pdf-parse';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileUrl, fileName, fileType, topic, questionCount = 5, subject = '' } = req.body;
  const cerebrasApiKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY || 'csk-48rn5nyym4cmkjtj4ttx5cre828h6dncehcf964vcrdt8dnn';
  const groqApiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  if (!cerebrasApiKey && !groqApiKey) {
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
          // Robust resolver for CJS module in ESM
          const pdfParser = typeof pdf === 'function' ? pdf : (pdf as any).default;
          
          if (typeof pdfParser === 'function') {
            console.log('Parsing PDF...');
            const data = await pdfParser(buffer);
            extractedText = data.text || '';
            console.log('PDF Extracted text length:', extractedText.length);
          } else {
             parseError = `Library PDF tidak terdeteksi sebagai fungsi (Tipe: ${typeof pdf}).`;
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
    const subjectContext = subject ? `Mata Pelajaran: ${subject}\n\n` : '';
    const formatInstruction = `PENTING: Anda harus menghasilkan soal pilihan ganda (Multiple Choice) dengan tepat 4 opsi jawaban (A, B, C, D) yang disesuaikan dengan isi materi dan mata pelajaran terkait.
Format wajib JSON array murni tanpa markdown:
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
      ]`;

    if (extractedText && extractedText.trim().length > 20) {
      prompt = `Buatkan ${questionCount} soal pilihan ganda dari teks berikut. 
      ${subjectContext}${formatInstruction}

      TEKS MATERI:
      ${extractedText.substring(0, 30000)}`;
    } else if (topic) {
      console.log('Falling back to topic-based generation');
      prompt = `Buatkan ${questionCount} soal kuis pilihan ganda tentang topik: "${topic}".
      ${subjectContext}${formatInstruction}`;
    } else {
      return res.status(400).json({ 
        message: `Gagal mengekstrak teks dari file. ${parseError ? `Detail: ${parseError}` : 'File mungkin kosong atau tidak terbaca.'} Pastikan file PDF bukan hasil scan gambar.` 
      });
    }

    const apiKey = cerebrasApiKey || groqApiKey;
    const apiUrl = cerebrasApiKey ? 'https://api.cerebras.ai/v1/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions';
    const model = cerebrasApiKey ? 'llama3.1-8b' : 'llama-3.3-70b-versatile';

    const aiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'Gagal memanggil AI API');

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
