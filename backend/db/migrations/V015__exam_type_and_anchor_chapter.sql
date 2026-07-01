ALTER TABLE public.exam_configs
ADD COLUMN IF NOT EXISTS exam_type TEXT NOT NULL DEFAULT 'MIDTERM_1';

ALTER TABLE public.exam_configs
ADD COLUMN IF NOT EXISTS anchor_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;

UPDATE public.exam_configs
SET exam_type = CASE
    WHEN slot_index = 0 THEN 'MIDTERM_1'
    WHEN slot_index = 1 THEN 'FINAL_1'
    WHEN slot_index = 2 THEN 'MIDTERM_2'
    ELSE 'FINAL_2'
END
WHERE exam_type IS NULL
   OR exam_type NOT IN ('MIDTERM_1', 'FINAL_1', 'MIDTERM_2', 'FINAL_2');

UPDATE public.exam_configs ec
SET anchor_chapter_id = (
    SELECT ch.id
    FROM public.chapters ch
    WHERE ch.course_id = ec.course_id
      AND ch.position <= ((ec.slot_index + 1) * 3)
    ORDER BY ch.position DESC
    LIMIT 1
)
WHERE ec.anchor_chapter_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_exam_configs_anchor_chapter
ON public.exam_configs (anchor_chapter_id);
