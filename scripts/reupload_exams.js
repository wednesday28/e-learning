import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const cache = {
  levels: {},
  grades: {},
  subjects: {},
  modules: {}
}

const results = []

async function processRecursive(item, context) {
  // 1. Level Resolution
  const knownSpecificLevels = ['POLICE_ACADEMIC', 'POLICE_PSYCHOLOGY', 'CPNS', 'Kedinasan', 'POLRI', 'UTBK-SNBT'];
  let level = item.level || context.level;
  if (!level && item.category) {
    if (knownSpecificLevels.includes(item.category)) {
      level = item.category;
    } else {
      level = 'EXAM_PREPARATION';
    }
  }

  const grade = item.grade || context.grade;
  
  // 2. Subject resolution
  let subject = item.subject || context.subject;
  if (!subject) {
    if (item.category && !knownSpecificLevels.includes(item.category)) {
      subject = item.category;
    } else if (item.package_name) {
      subject = item.package_name.split('-').pop()?.trim() || item.package_name;
    } else {
      subject = item.category || 'General';
    }
  }

  const topic = item.topic || item.package_name || context.topic
  const subtopic = item.subtopic || item.name || context.subtopic

  if (item.subtopics && Array.isArray(item.subtopics)) {
    for (const st of item.subtopics) {
      await processRecursive(st, { level, grade, subject, topic });
    }
    return
  }

  if (item.lessons && Array.isArray(item.lessons)) {
    for (const ls of item.lessons) {
      await processRecursive(ls, { level, grade, subject, topic, subtopic });
    }
    return
  }

  if (item.questions && Array.isArray(item.questions)) {
    for (const q of item.questions) {
      await processRecursive(q, { level, grade, subject, topic, subtopic });
    }
    return
  }

  const questionText = item.question || item.question_text || item.text || item.situation
  const isQuestion = !!questionText
  const lessonTitle = item.lesson?.title || item.title || item.judul || item.name
  const lessonContent = item.lesson?.content || item.content || item.konten || item.materi || item.isi
  
  if (!isQuestion && !lessonTitle) return;

  if (!level || !subject) return;

  try {
    // Resolve Level
    let levelId = cache.levels[level]
    if (!levelId) {
      const { data } = await supabase.from('levels').select('id').eq('name', level).single()
      if (data) {
        levelId = data.id
        cache.levels[level] = levelId
      } else {
        const { data: newLevel } = await supabase.from('levels').insert({ name: level }).select('id').single()
        if (newLevel) {
          levelId = newLevel.id
          cache.levels[level] = levelId
        }
      }
    }

    // Resolve Grade
    let gradeId = null
    if (grade) {
      const gradeClean = typeof grade === 'number' ? grade : parseInt(grade.toString().replace(/[^0-9]/g, ''))
      const gradeKey = `${levelId}_${gradeClean}`
      gradeId = cache.grades[gradeKey] || null
      if (!gradeId) {
        const { data } = await supabase.from('grades').select('id').eq('level_id', levelId).eq('grade_level', gradeClean).single()
        if (data) {
          gradeId = data.id
          cache.grades[gradeKey] = gradeId
        }
      }
    }

    // Resolve Subject
    const subjectKey = `${levelId}_${subject}`
    let subjectId = cache.subjects[subjectKey]
    if (!subjectId) {
      const { data } = await supabase.from('subjects').select('id').eq('level_id', levelId).eq('name', subject).single()
      if (data) {
        subjectId = data.id
        cache.subjects[subjectKey] = subjectId
      } else {
        const { data: newSub } = await supabase.from('subjects').insert({ level_id: levelId, name: subject }).select('id').single()
        if (newSub) {
          subjectId = newSub.id
          cache.subjects[subjectKey] = subjectId
        }
      }
    }

    if (isQuestion) {
      const options = item.options || item.choices
      const answer = item.answer || item.correct_answer || item.recommended_answer
      const { data: existingQ } = await supabase.from('questions').select('id').eq('subject_id', subjectId).eq('question_text', questionText).single()
      if (existingQ) {
        results.push({ success: true, note: 'Exists' })
        return
      }

      const { data: newQ } = await supabase.from('questions').insert({
        subject_id: subjectId,
        grade_id: gradeId,
        question_text: questionText,
        explanation: item.explanation || context.explanation || null,
        difficulty_level: item.difficulty || 'medium',
        type: 'multiple_choice'
      }).select('id').single()

      if (newQ && options) {
        let choices = []
        if (Array.isArray(options)) {
          choices = options.map((opt, idx) => {
            const label = String.fromCharCode(65 + idx); 
            const isCorrect = (typeof opt === 'object' && opt.is_correct) || (answer === label) || (opt === answer);
            return {
              question_id: newQ.id,
              text: typeof opt === 'object' ? opt.text : opt,
              is_correct: !!isCorrect
            };
          })
        }
        if (choices.length > 0) await supabase.from('choices').insert(choices)
      }
      results.push({ success: true })
    }
  } catch (err) {
    console.error('Error:', err.message)
  }
}

async function main() {
  const files = [
    'police_academic_tryout.json',
    'police_psychology_tryout.json',
    'utbk_snbt.json',
    'cpns_tiu.json',
    'cpns_tkp.json',
    'cpns_twk.json'
  ]
  
  for (const file of files) {
    console.log(`Re-uploading: ${file}...`)
    const content = fs.readFileSync(`./public/batches/${file}`, 'utf8')
    const items = JSON.parse(content)
    for (const item of Array.isArray(items) ? items : [items]) {
      await processRecursive(item, {})
    }
  }
  console.log('Re-upload finished.')
}

main().catch(console.error)
