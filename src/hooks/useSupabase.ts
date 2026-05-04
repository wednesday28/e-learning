import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (query: any) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await query;
      if (err) throw err;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, fetchData, supabase };
};
