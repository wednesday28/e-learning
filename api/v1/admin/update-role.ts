import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { userId, newRole } = req.body

  if (!userId || !newRole) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) throw error

    return res.status(200).json({ success: true, message: 'Role updated successfully' })
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
