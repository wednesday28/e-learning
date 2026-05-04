import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
// Use service role to bypass RLS for bulk ingestion
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const items = req.body
  if (!Array.isArray(items)) {
    return res.status(400).json({ message: 'Payload must be an array' })
  }

  try {
    const results: any[] = []
    
    // Cache for IDs to reduce queries
    const cache = {
      levels: {} as Record<string, string>,
      grades: {} as Record<string, string>,
      subjects: {} as Record<string, string>,
      modules: {} as Record<string, string>
    }

    for (const item of items) {
      const { level, grade, subject, topic, subtopic, lesson, question, options, answer, explanation } = item
      
      // Skip items without required fields
      if (!level || !subject) {
        results.push({ success: false, item: 'unknown', error: 'Missing required fields: level or subject' })
        continue
      }

      // Detect item type
      const isQuestion = !!question
      const hasLesson = lesson && typeof lesson === 'object' && lesson.title
      // Also support flat lesson format (title/content directly on item)
      const flatTitle = item.title || item.judul
      const flatContent = item.content || item.konten || item.materi || item.isi

      if (!isQuestion && !hasLesson && !flatTitle) {
        results.push({ success: false, item: topic || subtopic || 'unknown', error: 'Skipped: unrecognized item format' })
        continue
      }

      try {
        // 1. Get Level ID
        let levelId = cache.levels[level]
        if (!levelId) {
          const { data } = await supabase.from('levels').select('id').eq('name', level).single()
          if (data) {
            levelId = data.id
            cache.levels[level] = levelId
          } else {
            throw new Error(`Level not found: ${level}`)
          }
        }

        // 2. Get Grade ID (Optional)
        let gradeId: string | null = null
        if (grade) {
          const gradeKey = `${levelId}_${grade}`
          gradeId = cache.grades[gradeKey] || null
          if (!gradeId) {
            const { data } = await supabase
              .from('grades')
              .select('id')
              .eq('level_id', levelId)
              .eq('grade_level', grade)
              .single()
            if (data) {
              gradeId = data.id
              cache.grades[gradeKey] = gradeId
            } else {
              throw new Error(`Grade not found: ${grade} for level ${level}`)
            }
          }
        }

        // 3. Get Subject ID
        const subjectKey = `${levelId}_${subject}`
        let subjectId = cache.subjects[subjectKey]
        if (!subjectId) {
          const { data } = await supabase
            .from('subjects')
            .select('id')
            .eq('level_id', levelId)
            .eq('name', subject)
            .single()
          if (data) {
            subjectId = data.id
            cache.subjects[subjectKey] = subjectId
          } else {
            const { data: newSubject, error: subErr } = await supabase
              .from('subjects')
              .insert({ level_id: levelId, name: subject })
              .select('id')
              .single()
            if (newSubject) {
              subjectId = newSubject.id
              cache.subjects[subjectKey] = subjectId
            } else {
              throw new Error(`Failed to resolve subject: ${subject}. Error: ${subErr?.message}`)
            }
          }
        }

        if (isQuestion) {
          // === QUESTION / SOAL FORMAT ===
          const { data: existingQ } = await supabase
            .from('questions')
            .select('id')
            .eq('subject_id', subjectId)
            .eq('question_text', question)
            .single()

          if (existingQ) {
            results.push({ success: true, id: existingQ.id, title: question.substring(0, 60), note: 'Already exists' })
            continue
          }

          const { data: newQ, error: qErr } = await supabase
            .from('questions')
            .insert({
              subject_id: subjectId,
              grade_id: gradeId,
              question_text: question,
              explanation: explanation || null,
              difficulty_level: 'medium',
              type: 'multiple_choice'
            })
            .select('id')
            .single()

          if (qErr) {
            if (qErr.code === '23505') {
              results.push({ success: true, id: null, title: question.substring(0, 60), note: 'Duplicate skipped' })
            } else {
              results.push({ success: false, item: question.substring(0, 60), error: qErr.message })
            }
            continue
          }

          // Insert choices
          if (newQ && options && typeof options === 'object') {
            const choices = Object.entries(options).map(([key, text]) => ({
              question_id: newQ.id,
              text: text as string,
              is_correct: key === answer
            }))
            await supabase.from('choices').insert(choices)
          }

          results.push({ success: true, id: newQ?.id, title: question.substring(0, 60) })

        } else {
          // === LESSON / MATERI FORMAT ===
          const lessonTitle = hasLesson ? lesson.title : flatTitle
          const lessonContent = hasLesson ? (lesson.content || `Ringkasan materi untuk ${lessonTitle}.`) : (flatContent || `Ringkasan materi untuk ${lessonTitle}.`)
          const moduleTitle = (typeof topic === 'object' ? topic?.name : topic) || subtopic || 'General'
          const moduleKey = `${subjectId}_${gradeId || 'null'}_${moduleTitle}`
          
          let moduleId = cache.modules[moduleKey]
          if (!moduleId) {
            const { data: existingModule } = await supabase
              .from('modules')
              .select('id')
              .eq('subject_id', subjectId)
              .eq('grade_id', gradeId)
              .eq('title', moduleTitle)
              .single()
            
            if (existingModule) {
              moduleId = existingModule.id
              cache.modules[moduleKey] = moduleId
            } else {
              const { data: newModule, error: modErr } = await supabase
                .from('modules')
                .insert({
                  subject_id: subjectId,
                  grade_id: gradeId,
                  title: moduleTitle,
                  description: `Materi untuk ${subject} ${grade ? `kelas ${grade}` : '(Umum)'} - ${moduleTitle}`
                })
                .select('id')
                .single()
              
              if (newModule) {
                moduleId = newModule.id
                cache.modules[moduleKey] = moduleId
              } else {
                throw new Error(`Failed to create module: ${moduleTitle}. Error: ${modErr?.message}`)
              }
            }
          }

          const { data: newLesson, error: lessonErr } = await supabase
            .from('lessons')
            .insert({ module_id: moduleId, title: lessonTitle, content: lessonContent })
            .select('id')
            .single()
          
          if (lessonErr) {
            if (lessonErr.code === '23505') {
              results.push({ success: true, id: null, title: lessonTitle, note: 'Already exists, skipped' })
            } else {
              results.push({ success: false, item: lessonTitle, error: lessonErr.message })
            }
          } else {
            results.push({ success: true, id: newLesson?.id, title: lessonTitle })
          }
        }

      } catch (itemError: any) {
        results.push({ success: false, item: question?.substring(0, 40) || lesson?.title || flatTitle || 'unknown', error: itemError.message })
      }
    }

    res.status(200).json({
      success: true,
      processed: results.length,
      successCount: results.filter(r => r.success).length,
      errors: results.filter(r => !r.success)
    })

  } catch (error: any) {
    console.error('Bulk Upload Error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message 
    })
  }
}
