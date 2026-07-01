ALTER TABLE public.exam_configs
ADD COLUMN IF NOT EXISTS start_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;

WITH exam_positions AS (
    SELECT ec.id, ec.course_id, ec.slot_index, anchor_ch.position AS anchor_position
    FROM public.exam_configs ec
    LEFT JOIN public.chapters anchor_ch ON anchor_ch.id = ec.anchor_chapter_id
),
starts AS (
    SELECT DISTINCT ON (ep.id)
        ep.id,
        ch.id AS start_chapter_id
    FROM exam_positions ep
    JOIN public.chapters ch ON ch.course_id = ep.course_id
    WHERE ep.anchor_position IS NOT NULL
      AND ch.position > COALESCE((
          SELECT MAX(prev_anchor.position)
          FROM public.exam_configs prev
          JOIN public.chapters prev_anchor ON prev_anchor.id = prev.anchor_chapter_id
          WHERE prev.course_id = ep.course_id
            AND prev.slot_index < ep.slot_index
            AND prev_anchor.position < ep.anchor_position
      ), 0)
      AND ch.position <= ep.anchor_position
    ORDER BY ep.id, ch.position ASC
)
UPDATE public.exam_configs ec
SET start_chapter_id = starts.start_chapter_id
FROM starts
WHERE ec.id = starts.id
  AND ec.start_chapter_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_exam_configs_start_chapter
ON public.exam_configs (start_chapter_id);
