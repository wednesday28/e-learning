import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup basic __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const cerebrasApiKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY || 'csk-48rn5nyym4cmkjtj4ttx5cre828h6dncehcf964vcrdt8dnn';

const cache = {
  levels: {},
  grades: {},
  subjects: {},
  modules: {}
};

async function generateQuestions(lessonContent, subjectName) {
  if (!lessonContent || lessonContent.length < 50) return null;
  
  const subjectContext = subjectName ? `Mata Pelajaran: ${subjectName}\n\n` : '';
  const prompt = `Buatkan 5 soal pilihan ganda berdasarkan teks materi berikut.
PENTING: Anda harus menghasilkan tepat 5 soal pilihan ganda dengan 4 opsi (A, B, C, D).
Format wajib JSON array murni tanpa markdown:
[
  {
    "question_text": "...",
    "difficulty_level": "medium",
    "explanation": "...",
    "choices": [
      {"text": "A. ...", "is_correct": true},
      {"text": "B. ...", "is_correct": false},
      {"text": "C. ...", "is_correct": false},
      {"text": "D. ...", "is_correct": false}
    ]
  }
]

${subjectContext}TEKS MATERI:
${lessonContent.substring(0, 30000)}`;

  try {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cerebrasApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Cerebras API Error');
    
    let content = data.choices[0]?.message?.content || '';
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(content);
  } catch (err) {
    console.error("  -> AI Generation Failed:", err.message);
    return null;
  }
}

async function processRecursive(item, context) {
  const level = item.level || context.level || (item.category ? 'EXAM_PREPARATION' : null);
  const grade = item.grade || context.grade;
  const subject = item.subject || item.category || context.subject;
  const topic = item.topic || item.package_name || context.topic;
  const subtopic = item.subtopic || item.name || context.subtopic;

  if (item.subtopics && Array.isArray(item.subtopics)) {
    for (const st of item.subtopics) await processRecursive(st, { level, grade, subject, topic });
    return;
  }

  if (item.lessons && Array.isArray(item.lessons)) {
    for (const ls of item.lessons) await processRecursive(ls, { level, grade, subject, topic, subtopic });
    return;
  }

  if (item.questions && Array.isArray(item.questions)) return; // Skip raw questions

  const lessonTitle = item.lesson?.title || item.title || item.judul || item.name;
  let lessonContent = item.lesson?.content || item.content || item.konten || item.materi || item.isi;

  if (!lessonTitle || !level || !subject) return;

  // Resolvers
  let levelId = cache.levels[level];
  if (!levelId) {
    const { data } = await supabase.from('levels').select('id').eq('name', level).single();
    if (data) { levelId = data.id; cache.levels[level] = levelId; }
    else throw new Error(`Level not found: ${level}`);
  }

  let gradeId = null;
  if (grade) {
    const gradeClean = typeof grade === 'number' ? grade : parseInt(grade.toString().replace(/[^0-9]/g, ''));
    const gradeKey = `${levelId}_${gradeClean}`;
    gradeId = cache.grades[gradeKey];
    if (!gradeId) {
      const { data } = await supabase.from('grades').select('id').eq('level_id', levelId).eq('grade_level', gradeClean).single();
      if (data) { gradeId = data.id; cache.grades[gradeKey] = gradeId; }
    }
  }

  const subjectKey = `${levelId}_${subject}`;
  let subjectId = cache.subjects[subjectKey];
  if (!subjectId) {
    const { data } = await supabase.from('subjects').select('id').eq('level_id', levelId).eq('name', subject).single();
    if (data) { subjectId = data.id; cache.subjects[subjectKey] = subjectId; }
    else {
      const { data: newSub } = await supabase.from('subjects').insert({ level_id: levelId, name: subject }).select('id').single();
      subjectId = newSub.id; cache.subjects[subjectKey] = subjectId;
    }
  }

  const moduleTitle = topic || subtopic || 'General';
  const moduleKey = `${subjectId}_${gradeId || 'null'}_${moduleTitle}`;
  let moduleId = cache.modules[moduleKey];

  if (!moduleId) {
    const { data } = await supabase.from('modules').select('id').eq('subject_id', subjectId).eq('grade_id', gradeId).eq('title', moduleTitle).single();
    if (data) { moduleId = data.id; cache.modules[moduleKey] = moduleId; }
    else {
      const { data: newMod } = await supabase.from('modules').insert({
        subject_id: subjectId, grade_id: gradeId, title: moduleTitle, description: `Materi ${subject} - ${moduleTitle}`
      }).select('id').single();
      moduleId = newMod.id; cache.modules[moduleKey] = moduleId;
    }
  }

  let lessonId;
  const { data: existingLesson } = await supabase.from('lessons').select('id').eq('module_id', moduleId).eq('title', lessonTitle).single();
  
  if (existingLesson) {
    lessonId = existingLesson.id;
  } else {
    if (Array.isArray(lessonContent)) lessonContent = lessonContent.map(x => JSON.stringify(x)).join('\n\n');
    else if (typeof lessonContent === 'object') lessonContent = JSON.stringify(lessonContent);
    
    const { data: newLesson, error: lErr } = await supabase.from('lessons').insert({
      module_id: moduleId, title: lessonTitle, content: lessonContent || `Konten untuk ${lessonTitle}`
    }).select('id').single();
    
    if (lErr) throw lErr;
    lessonId = newLesson.id;
  }

  // AI Generation Phase
  const sourceTag = `[LESSON:${lessonId}]`;
  const { data: existingQ } = await supabase.from('questions').select('id').eq('source', sourceTag).limit(1);
  
  if (existingQ && existingQ.length > 0) {
    console.log(`[SKIP] Questions exist for: ${lessonTitle.substring(0, 30)}...`);
    return;
  }

  console.log(`[PROCESS] Generating questions for: ${lessonTitle.substring(0, 30)}...`);
  const questions = await generateQuestions(lessonContent, subject);
  
  if (questions && questions.length > 0) {
    for (const q of questions) {
      const { data: qData, error: qErr } = await supabase.from('questions').insert({
        subject_id: subjectId, grade_id: gradeId,
        question_text: q.question_text || q.question,
        explanation: q.explanation || null,
        difficulty_level: q.difficulty_level || 'medium',
        type: 'multiple_choice',
        source: sourceTag
      }).select('id').single();

      if (qData && q.choices) {
        let choicesToInsert = [];
        if (typeof q.choices[0] === 'string') {
          choicesToInsert = q.choices.map((txt, idx) => ({ question_id: qData.id, text: txt, is_correct: idx === 0 }));
        } else {
          choicesToInsert = q.choices.map(c => ({ question_id: qData.id, text: c.text, is_correct: !!c.is_correct }));
        }
        await supabase.from('choices').insert(choicesToInsert);
      }
    }
    console.log(`  -> SUCCESS: 5 questions inserted.`);
  } else {
    console.log(`  -> FAILED: Could not generate questions.`);
  }
  
  // Rate limiting Cerebras
  await new Promise(r => setTimeout(r, 1500));
}

async function main() {
  const batchesDir = path.join(__dirname, '../public/batches');
  const files = fs.readdirSync(batchesDir).filter(f => f.endsWith('.json'));
  
  console.log(`Found ${files.length} batch files.`);
  
  for (const file of files) {
    console.log(`\n--- Processing File: ${file} ---`);
    try {
      const data = JSON.parse(fs.readFileSync(path.join(batchesDir, file), 'utf-8'));
      if (Array.isArray(data)) {
        for (const item of data) await processRecursive(item, {});
      } else {
        await processRecursive(data, {});
      }
    } catch (e) {
      console.error(`Error processing ${file}:`, e.message);
    }
  }
  
  console.log("All batches processed!");
}

main();
