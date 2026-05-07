import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const files = [
  'public/batches/police_academic_tryout.json',
  'public/batches/police_psychology_tryout.json'
];

async function getLevelId(name) {
  const { data } = await supabase.from('levels').select('id').eq('name', name).maybeSingle();
  if (data) return data.id;
  const { data: newLevel } = await supabase.from('levels').insert({ name, description: `Jenjang ${name}` }).select().single();
  return newLevel.id;
}

async function getGradeId(levelId, name) {
  const { data } = await supabase.from('grades').select('id').eq('level_id', levelId).eq('name', name).maybeSingle();
  if (data) return data.id;
  const { data: newGrade } = await supabase.from('grades').insert({ level_id: levelId, name, grade_level: 0 }).select().single();
  return newGrade.id;
}

async function getSubjectId(levelId, name) {
  const { data } = await supabase.from('subjects').select('id').eq('level_id', levelId).eq('name', name).maybeSingle();
  if (data) return data.id;
  const { data: newSub } = await supabase.from('subjects').insert({ level_id: levelId, name }).select().single();
  return newSub.id;
}

async function run() {
  const levelId = await getLevelId('POLRI');
  const gradeId = await getGradeId(levelId, 'Umum');

  for (const file of files) {
    console.log(`[PROCESS] File: ${file}`);
    const content = JSON.parse(fs.readFileSync(file, 'utf-8'));

    for (const pkg of content) {
      console.log(`  -> Package: ${pkg.package_name}`);
      const subjectId = await getSubjectId(levelId, pkg.category || 'POLRI');

      // 1. Create Module if not exists
      const { data: module } = await supabase.from('modules').select('id').eq('subject_id', subjectId).eq('title', pkg.package_name).maybeSingle();
      let moduleId = module?.id;
      if (!moduleId) {
        const { data: newMod } = await supabase.from('modules').insert({
          subject_id: subjectId,
          grade_id: gradeId,
          title: pkg.package_name,
          description: `Tryout ${pkg.package_name}`
        }).select().single();
        moduleId = newMod.id;
      }

      // 2. Create Quiz Package
      const { data: quizPkg } = await supabase.from('quiz_packages').insert({
        title: pkg.package_name,
        description: `Tryout POLRI - ${pkg.package_name}`,
        level_id: levelId,
        duration: pkg.duration_minutes || 60
      }).select().single();

      // 3. Insert Questions
      for (const q of pkg.questions) {
        const { data: question } = await supabase.from('questions').insert({
          subject_id: subjectId,
          grade_id: gradeId,
          question_text: q.question_text,
          difficulty_level: 'medium',
          type: 'multiple_choice',
          explanation: q.explanation
        }).select().single();

        if (question) {
          // Link to Package
          await supabase.from('quiz_package_questions').insert({
            package_id: quizPkg.id,
            question_id: question.id,
            order_index: q.number || 0
          });

          // Insert Choices
          const correctAnswer = q.correct_answer || q.recommended_answer;
          const choices = q.options.map((opt, idx) => ({
            question_id: question.id,
            text: opt,
            is_correct: correctAnswer ? (idx === (correctAnswer.charCodeAt(0) - 65)) : false
          }));
          await supabase.from('choices').insert(choices);
        }
      }
      console.log(`     DONE: ${pkg.questions.length} questions.`);
    }
  }
  console.log("ALL FINISHED.");
}

run().catch(console.error);
