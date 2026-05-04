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
    const results = []
    
    // Cache for IDs to reduce queries
    const cache = {
      levels: {} as Record<string, string>,
      grades: {} as Record<string, string>,
      subjects: {} as Record<string, string>,
      modules: {} as Record<string, string>
    }

    for (const item of items) {
      const { level, grade, subject, topic, subtopic, lesson } = item
      
      // Skip items without required fields or lesson data
      if (!level || !subject) {
        results.push({ success: false, item: 'unknown', error: 'Missing required fields: level or subject' })
        continue
      }
      if (!lesson || typeof lesson !== 'object' || !lesson.title) {
        // This item might be a question/exam item, skip silently
        results.push({ success: false, item: topic?.name || subtopic || 'unknown', error: 'Skipped: no lesson data (may be a question item)' })
        continue
      }

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
      let gradeId = null
      if (grade) {
        const gradeKey = `${levelId}_${grade}`
        gradeId = cache.grades[gradeKey]
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
          // Create subject if it doesn't exist?
          // For now, let's just create it to be safe if the user provided it
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

      // 4. Get/Create Module ID
      // Mapping: topic.name -> module.title
      const moduleTitle = topic?.name || subtopic || 'General'
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

      // 5. Insert Lesson
      const { data: newLesson, error: lessonErr } = await supabase
        .from('lessons')
        .insert({
          module_id: moduleId,
          title: lesson.title,
          content: lesson.content || `Ringkasan materi untuk ${lesson.title}.`
        })
        .select('id')
        .single()
      
      if (lessonErr) {
        if (lessonErr.code === '23505') {
          // Duplicate - skip gracefully
          results.push({ success: true, id: null, title: lesson.title, note: 'Already exists, skipped' })
        } else {
          results.push({ success: false, item: lesson.title, error: lessonErr.message })
        }
      } else {
        results.push({ success: true, id: newLesson?.id, title: lesson.title })
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
