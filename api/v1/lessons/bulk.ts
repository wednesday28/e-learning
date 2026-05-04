import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const items = req.body
  if (!Array.isArray(items)) return res.status(400).json({ message: 'Payload must be an array' })

  const results: any[] = []
  const cache = {
    levels: {} as Record<string, string>,
    grades: {} as Record<string, string>,
    subjects: {} as Record<string, string>,
    modules: {} as Record<string, string>
  }

  async function processRecursive(item: any, context: any) {
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
      // If we are at a node that isn't a leaf but has no branches, it might be a malformed item or just a container
      if (item.level && item.subject) return; // Ignore top level container if processed recursively
      results.push({ success: false, item: topic || subtopic || 'unknown', error: 'Skipped: unrecognized item format or missing leaf data' })
      return
    }

    // Validation
    if (!level || !subject) {
      results.push({ success: false, item: lessonTitle || questionText?.substring(0, 20) || 'unknown', error: 'Missing required fields: level (category) or subject' })
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
          // If level doesn't exist, we might want to create it? For now, throw error.
          throw new Error(`Level not found: ${level}. Please create level in database first.`)
        }
      }

      // B. Resolve Grade
      let gradeId: string | null = null
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
        // === PROCESS QUESTION ===
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
            // Format: [{text: "...", is_correct: true}, ...] OR ["Opt 1", "Opt 2", ...]
            choices = options.map((opt, idx) => {
              const label = String.fromCharCode(65 + idx); // A, B, C, D...
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
            // Format: { A: "...", B: "..." }
            choices = Object.entries(options).map(([key, text]) => ({
              question_id: newQ.id,
              text: text as string,
              is_correct: key === answer
            }))
          }
          if (choices.length > 0) await supabase.from('choices').insert(choices)
        }
        results.push({ success: true, id: newQ?.id, title: questionText.substring(0, 50) })

      } else {
        // === PROCESS LESSON ===
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
    } catch (err: any) {
      results.push({ success: false, item: lessonTitle || questionText?.substring(0, 30), error: err.message })
    }
  }

  try {
    for (const item of items) {
      await processRecursive(item, {})
    }

    res.status(200).json({
      success: true,
      processed: results.length,
      successCount: results.filter(r => r.success).length,
      errors: results.filter(r => !r.success)
    })
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}
