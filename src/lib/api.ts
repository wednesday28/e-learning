import { supabase } from './supabase';

export const api = {
  // Curriculum
  getLevels: () => supabase.from('levels').select('*'),
  getGrades: (levelId: string) => supabase.from('grades').select('*').eq('level_id', levelId),
  getSubjects: (gradeId: string) => supabase.from('subjects').select('*').eq('grade_id', gradeId),
  
  // Progress
  updateXP: async (userId: string, points: number) => {
    const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', userId).single();
    const newXP = (profile?.total_xp || 0) + points;
    return supabase.from('profiles').update({ total_xp: newXP }).eq('id', userId);
  },

  // Audit
  logAction: (userId: string, action: string, target: string, details: any) => {
    return supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      target,
      details
    });
  }
};
