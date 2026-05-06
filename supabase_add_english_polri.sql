-- Menambahkan Mata Pelajaran Bahasa Inggris ke Jenjang POLRI
DO $$
DECLARE
    v_level_id UUID;
BEGIN
    -- Mencari ID untuk jenjang POLRI
    SELECT id INTO v_level_id FROM public.levels WHERE name = 'POLRI';
    
    IF v_level_id IS NOT NULL THEN
        -- Memasukkan subjek Bahasa Inggris jika belum ada
        INSERT INTO public.subjects (level_id, name)
        VALUES (v_level_id, 'Bahasa Inggris')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Berhasil menambahkan atau memverifikasi Bahasa Inggris di POLRI.';
    ELSE
        RAISE NOTICE 'Jenjang POLRI tidak ditemukan.';
    END IF;
END $$;
