import type { VercelRequest, VercelResponse } from '@vercel/node';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { fileUrl, fileName, fileType } = req.body;

  if (!fileUrl) {
    return res.status(400).json({ message: 'File URL is required' });
  }

  try {
    // 1. Fetch the file
    const response = await fetch(fileUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    let extractedText = '';

    // 2. Extract text based on file type
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ message: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' });
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ message: 'Could not extract enough text from the file.' });
    }

    // 3. Send to AI (Groq for speed and cost-effectiveness in this demo)
    const groqApiKey = process.env.VITE_GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(200).json({ 
        message: 'File parsed but AI key missing. Showing raw text.',
        rawText: extractedText.substring(0, 2000) 
      });
    }

    const prompt = `Analisis teks berikut dan ekstrak pertanyaan pilihan ganda untuk kuis. 
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
    const content = aiData.choices[0].message.content;
    
    // Clean markdown if exists
    const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions = JSON.parse(cleanedContent);

    res.status(200).json({ questions });

  } catch (error: any) {
    console.error('File Parsing Error:', error);
    res.status(500).json({ message: 'Error processing file: ' + error.message });
  }
}
