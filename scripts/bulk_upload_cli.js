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
  // 1. Inherit or override context
  const level = item.level || context.level || (item.category ? 'EXAM_PREPARATION' : null)
  const grade = item.grade || context.grade
  const subject = item.subject || item.category || context.subject
  const topic = item.topic || item.package_name || context.topic
  const subtopic = item.subtopic || item.name || context.subtopic

  // 2. Handle branching (Recursion)
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

  // 3. Process Leaf Node (Single Lesson or Single Question)
  const questionText = item.question || item.question_text || item.text || item.situation
  const isQuestion = !!questionText
  const lessonTitle = item.lesson?.title || item.title || item.judul || item.name
  const lessonContent = item.lesson?.content || item.content || item.konten || item.materi || item.isi
  
  if (!isQuestion && !lessonTitle) {
    if (item.level && item.subject) return; 
    results.push({ success: false, item: topic || subtopic || 'unknown', error: 'Skipped: unrecognized item format or missing leaf data' })
    return
  }

  if (!level || !subject) {
    results.push({ success: false, item: lessonTitle || (questionText ? questionText.substring(0, 20) : 'unknown'), error: 'Missing required fields: level (category) or subject' })
    return
  }

  try {
    // A. Resolve Level
    let levelId = cache.levels[level]
    if (!levelId) {
      const { data } = await supabase.from('levels').select('id').eq('name', level).single()
      if (data) {
        levelId = data.id
        cache.levels[level] = levelId
      } else {
        const { data: newLevel, error: lvErr } = await supabase.from('levels').insert({ name: level }).select('id').single()
        if (newLevel) {
          levelId = newLevel.id
          cache.levels[level] = levelId
        } else {
          throw new Error(`Level not found and failed to create: ${level}`)
        }
      }
    }

    // B. Resolve Grade
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
        } else {
          const { data: newGrade } = await supabase.from('grades').insert({ level_id: levelId, grade_level: gradeClean }).select('id').single()
          if (newGrade) {
            gradeId = newGrade.id
            cache.grades[gradeKey] = gradeId
          }
        }
      }
    }

    // C. Resolve Subject
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
        } else {
          throw new Error(`Failed to resolve subject: ${subject}`)
        }
      }
    }

    if (isQuestion) {
      const options = item.options || item.choices
      const answer = item.answer || item.correct_answer || item.recommended_answer
      const explanation = item.explanation || context.explanation

      const { data: existingQ } = await supabase.from('questions').select('id').eq('subject_id', subjectId).eq('question_text', questionText).single()
      if (existingQ) {
        results.push({ success: true, id: existingQ.id, title: questionText.substring(0, 50), note: 'Exists' })
        return
      }

      const { data: newQ, error: qErr } = await supabase.from('questions').insert({
        subject_id: subjectId,
        grade_id: gradeId,
        question_text: questionText,
        explanation: explanation || null,
        difficulty_level: item.difficulty || 'medium',
        type: 'multiple_choice'
      }).select('id').single()

      if (qErr) throw qErr

      if (newQ && options) {
        let choices = []
        if (Array.isArray(options)) {
          choices = options.map((opt, idx) => {
            const label = String.fromCharCode(65 + idx); 
            const isCorrect = (typeof opt === 'object' && opt.is_correct) || 
                             (answer === label) || 
                             (opt === answer) ||
                             (typeof opt === 'object' && opt.text === answer);
            
            return {
              question_id: newQ.id,
              text: typeof opt === 'object' ? opt.text : opt,
              is_correct: !!isCorrect
            };
          })
        } else if (typeof options === 'object') {
          choices = Object.entries(options).map(([key, text]) => ({
            question_id: newQ.id,
            text: text,
            is_correct: key === answer
          }))
        }
        if (choices.length > 0) await supabase.from('choices').insert(choices)
      }
      results.push({ success: true, id: newQ?.id, title: questionText.substring(0, 50) })

    } else {
      const moduleTitle = topic || subtopic || 'General'
      const moduleKey = `${subjectId}_${gradeId || 'null'}_${moduleTitle}`
      let moduleId = cache.modules[moduleKey]

      if (!moduleId) {
        const { data: existingMod } = await supabase.from('modules').select('id').eq('subject_id', subjectId).eq('grade_id', gradeId).eq('title', moduleTitle).single()
        if (existingMod) {
          moduleId = existingMod.id
          cache.modules[moduleKey] = moduleId
        } else {
          const { data: newMod } = await supabase.from('modules').insert({
            subject_id: subjectId,
            grade_id: gradeId,
            title: moduleTitle,
            description: `Materi ${subject} - ${moduleTitle}`
          }).select('id').single()
          if (newMod) {
            moduleId = newMod.id
            cache.modules[moduleKey] = moduleId
          } else {
            throw new Error(`Failed to create module: ${moduleTitle}`)
          }
        }
      }

      const { data: newLesson, error: lErr } = await supabase.from('lessons').insert({
        module_id: moduleId,
        title: lessonTitle,
        content: lessonContent || `Konten untuk ${lessonTitle}`
      }).select('id').single()

      if (lErr && lErr.code !== '23505') throw lErr
      results.push({ success: true, id: newLesson?.id || null, title: lessonTitle, note: lErr ? 'Exists' : undefined })
    }
  } catch (err) {
    results.push({ success: false, item: lessonTitle || (questionText ? questionText.substring(0, 30) : 'unknown'), error: err.message })
  }
}

async function uploadFile(filePath) {
  console.log(`\n--- Memproses: ${path.basename(filePath)} ---`)
  const content = fs.readFileSync(filePath, 'utf8')
  let items
  try {
    items = JSON.parse(content)
  } catch (e) {
    console.error(`Kritis: Gagal parsing JSON di ${filePath}: ${e.message}`)
    return
  }

  if (!Array.isArray(items)) items = [items]

  const initialResultsLength = results.length
  let i = 0
  for (const item of items) {
    i++
    if (i % 10 === 0) process.stdout.write('.')
    await processRecursive(item, {})
  }
  console.log()
  
  const fileResults = results.slice(initialResultsLength)
  const successCount = fileResults.filter(r => r.success).length
  const errorCount = fileResults.filter(r => !r.success).length
  
  console.log(`[${path.basename(filePath)}] Ditemukan ${items.length} item materi.`)
  console.log(`[${path.basename(filePath)}] Berhasil: ${successCount}, Error: ${errorCount}.`)
  
  if (errorCount > 0) {
    fileResults.filter(r => !r.success).forEach(err => {
      console.log(`[${path.basename(filePath)}] Error pada ${err.item}: ${err.error}`)
    })
  }
}

async function main() {
  const batchDir = './public/batches'
  const files = fs.readdirSync(batchDir).filter(f => f.endsWith('.json'))
  
  console.log(`Mulai memproses ${files.length} file...`)
  
  for (const file of files) {
    await uploadFile(path.join(batchDir, file))
  }
  
  console.log('\n=== SELESAI ===')
  console.log(`Total item diproses: ${results.length}`)
  console.log(`Total berhasil: ${results.filter(r => r.success).length}`)
  console.log(`Total error: ${results.filter(r => !r.success).length}`)
}

main().catch(console.error)
