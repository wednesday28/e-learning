import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_DIR = './public/batches';
const BATCH_SIZE = 50;

async function ingestFile(filePath) {
  console.log(`\n📄 Processing: ${path.basename(filePath)}`);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`  ❌ Failed to parse JSON: ${err.message}`);
    return;
  }
  
  const cache = {
    levels: {},
    grades: {},
    subjects: {},
    modules: {}
  };

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    console.log(`  ⏳ Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(data.length / BATCH_SIZE)}...`);

    for (const item of batch) {
      try {
        const { level, grade, subject, topic, subtopic, lesson, question } = item;
        if (!level || !subject) {
          throw new Error('Missing level or subject');
        }

        const isExam = !!question;

        // 1. Level
        let levelId = cache.levels[level];
        if (!levelId) {
          const { data: lData } = await supabase.from('levels').select('id').eq('name', level).single();
          if (lData) {
            levelId = lData.id;
            cache.levels[level] = levelId;
          } else {
            const { data: nLevel } = await supabase.from('levels').insert({ name: level }).select('id').single();
            if (nLevel) {
              levelId = nLevel.id;
              cache.levels[level] = levelId;
            } else throw new Error(`Level ${level} not found`);
          }
        }

        // 2. Grade
        let gradeId = null;
        if (grade) {
          const gradeKey = `${levelId}_${grade}`;
          gradeId = cache.grades[gradeKey];
          if (!gradeId) {
            const { data: gData } = await supabase.from('grades').select('id').eq('level_id', levelId).eq('grade_level', grade).single();
            if (gData) {
              gradeId = gData.id;
              cache.grades[gradeKey] = gradeId;
            } else {
              const { data: nGrade } = await supabase.from('grades').insert({ 
                level_id: levelId, 
                grade_level: grade, 
                name: `Kelas ${grade}`,
                phase: grade <= 2 ? 'Phase A' : grade <= 4 ? 'Phase B' : grade <= 6 ? 'Phase C' : grade <= 9 ? 'Phase D' : grade <= 10 ? 'Phase E' : 'Phase F'
              }).select('id').single();
              if (nGrade) {
                gradeId = nGrade.id;
                cache.grades[gradeKey] = gradeId;
              }
            }
          }
        }

        // 3. Subject
        const subjectKey = `${levelId}_${subject}`;
        let subjectId = cache.subjects[subjectKey];
        if (!subjectId) {
          const { data: sData } = await supabase.from('subjects').select('id').eq('level_id', levelId).eq('name', subject).single();
          if (sData) {
            subjectId = sData.id;
            cache.subjects[subjectKey] = subjectId;
          } else {
            const { data: nSubject } = await supabase.from('subjects').insert({ level_id: levelId, name: subject }).select('id').single();
            if (nSubject) {
              subjectId = nSubject.id;
              cache.subjects[subjectKey] = subjectId;
            } else throw new Error(`Subject ${subject} not found`);
          }
        }

        if (isExam) {
          // 4. Question
          const { options, answer, scores, explanation } = item;
          const { data: nQuestion, error: qErr } = await supabase.from('questions').insert({
            subject_id: subjectId,
            grade_id: gradeId,
            question_text: question,
            explanation: explanation,
            difficulty_level: 'medium',
            type: scores ? 'personality' : 'multiple_choice'
          }).select('id').single();

          if (qErr) {
            if (qErr.code === '23505') { successCount++; continue; }
            else throw qErr;
          } else if (nQuestion) {
            // 5. Choices
            let choices;
            if (scores) {
              const maxScore = Math.max(...Object.values(scores));
              choices = Object.entries(options).map(([key, text]) => ({
                question_id: nQuestion.id,
                text: text,
                is_correct: scores[key] === maxScore
              }));
            } else {
              choices = Object.entries(options).map(([key, text]) => ({
                question_id: nQuestion.id,
                text: text,
                is_correct: key === answer
              }));
            }
            const { error: cErr } = await supabase.from('choices').insert(choices);
            if (cErr) throw cErr;
          }
        } else {
          // 4. Module
          const moduleTitle = (typeof topic === 'object' ? topic?.name : topic) || subtopic || 'General';
          const moduleKey = `${subjectId}_${gradeId || 'no-grade'}_${moduleTitle}`;
          let moduleId = cache.modules[moduleKey];
          if (!moduleId) {
            const { data: mData } = await supabase.from('modules').select('id').eq('subject_id', subjectId).eq('grade_id', gradeId).eq('title', moduleTitle).single();
            if (mData) {
              moduleId = mData.id;
              cache.modules[moduleKey] = moduleId;
            } else {
              const { data: nModule } = await supabase.from('modules').insert({
                subject_id: subjectId,
                grade_id: gradeId,
                title: moduleTitle,
                description: `Materi untuk ${subject} - ${moduleTitle}`
              }).select('id').single();
              if (nModule) {
                moduleId = nModule.id;
                cache.modules[moduleKey] = moduleId;
              } else throw new Error(`Module ${moduleTitle} not found`);
            }
          }

          // 5. Lesson
          const { error: lErr } = await supabase.from('lessons').insert({
            module_id: moduleId,
            title: lesson.title,
            content: lesson.content || `Ringkasan materi untuk ${lesson.title}.`
          });

          if (lErr) {
            if (lErr.code === '23505') { /* duplicate skip */ }
            else throw lErr;
          }
        }
        successCount++;
      } catch (err) {
        console.error(`  ❌ Error item:`, err.message);
        errorCount++;
      }
    }
  }
  console.log(`  ✅ Done: ${successCount} success, ${errorCount} errors.`);
}

async function main() {
  const allFiles = fs.readdirSync(BATCH_DIR).filter(f => f.endsWith('.json'));
  console.log(`🚀 Starting ingestion of ${allFiles.length} files...`);
  
  for (const file of allFiles) {
    await ingestFile(path.join(BATCH_DIR, file));
  }
  console.log('\n🎉 ALL DONE!');
}

main();
