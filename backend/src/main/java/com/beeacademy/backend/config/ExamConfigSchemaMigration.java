package com.beeacademy.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExamConfigSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        Boolean hasCoursesTable = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'courses'
                )
                """, Boolean.class);

        if (!Boolean.TRUE.equals(hasCoursesTable)) {
            return;
        }

        log.info("Ensuring exam_configs table exists");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS public.exam_configs (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
                    teacher_id UUID NOT NULL REFERENCES public.profiles(id),
                    slot_index INTEGER NOT NULL,
                    exam_type TEXT NOT NULL DEFAULT 'MIDTERM_1',
                    anchor_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
                    start_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    duration_minutes INTEGER NOT NULL,
                    pass_score_percent INTEGER NOT NULL,
                    multiple_choice_score DOUBLE PRECISION NOT NULL DEFAULT 10,
                    essay_score DOUBLE PRECISION NOT NULL DEFAULT 0,
                    max_attempts INTEGER NOT NULL DEFAULT 1,
                    shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
                    shuffle_options BOOLEAN NOT NULL DEFAULT TRUE,
                    show_answer_after_submit BOOLEAN NOT NULL DEFAULT FALSE,
                    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    CONSTRAINT uk_exam_configs_course_slot UNIQUE (course_id, slot_index)
                )
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.exam_configs
                ADD COLUMN IF NOT EXISTS exam_type TEXT NOT NULL DEFAULT 'MIDTERM_1',
                ADD COLUMN IF NOT EXISTS anchor_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS start_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
                ADD COLUMN IF NOT EXISTS multiple_choice_score DOUBLE PRECISION NOT NULL DEFAULT 10,
                ADD COLUMN IF NOT EXISTS essay_score DOUBLE PRECISION NOT NULL DEFAULT 0
                """);
        jdbcTemplate.execute("""
                UPDATE public.exam_configs
                SET exam_type = CASE
                    WHEN slot_index = 0 THEN 'MIDTERM_1'
                    WHEN slot_index = 1 THEN 'FINAL_1'
                    WHEN slot_index = 2 THEN 'MIDTERM_2'
                    ELSE 'FINAL_2'
                END
                WHERE exam_type IS NULL
                   OR exam_type NOT IN ('MIDTERM_1', 'FINAL_1', 'MIDTERM_2', 'FINAL_2')
                """);
        jdbcTemplate.execute("""
                UPDATE public.exam_configs ec
                SET anchor_chapter_id = (
                    SELECT ch.id
                    FROM public.chapters ch
                    WHERE ch.course_id = ec.course_id
                      AND ch.position <= ((ec.slot_index + 1) * 3)
                    ORDER BY ch.position DESC
                    LIMIT 1
                )
                WHERE ec.anchor_chapter_id IS NULL
                """);
        jdbcTemplate.execute("""
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
                  AND ec.start_chapter_id IS NULL
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_exam_configs_course
                ON public.exam_configs (course_id)
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_exam_configs_teacher
                ON public.exam_configs (teacher_id)
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_exam_configs_anchor_chapter
                ON public.exam_configs (anchor_chapter_id)
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_exam_configs_start_chapter
                ON public.exam_configs (start_chapter_id)
                """);
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS public.exam_attempts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
                    exam_config_id UUID NOT NULL REFERENCES public.exam_configs(id) ON DELETE CASCADE,
                    questions_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
                    answers JSONB,
                    essay_answers JSONB,
                    essay_image_urls JSONB,
                    score_percent NUMERIC(5,1),
                    manual_score_percent NUMERIC(5,1),
                    teacher_feedback TEXT,
                    graded_at TIMESTAMPTZ,
                    passed BOOLEAN,
                    attempt_number INTEGER NOT NULL,
                    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    submitted_at TIMESTAMPTZ
                )
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.exam_attempts
                ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
                ADD COLUMN IF NOT EXISTS exam_config_id UUID REFERENCES public.exam_configs(id) ON DELETE CASCADE,
                ADD COLUMN IF NOT EXISTS questions_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS answers JSONB,
                ADD COLUMN IF NOT EXISTS essay_answers JSONB,
                ADD COLUMN IF NOT EXISTS essay_image_urls JSONB,
                ADD COLUMN IF NOT EXISTS score_percent NUMERIC(5,1),
                ADD COLUMN IF NOT EXISTS manual_score_percent NUMERIC(5,1),
                ADD COLUMN IF NOT EXISTS teacher_feedback TEXT,
                ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS passed BOOLEAN,
                ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1,
                ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_exam
                ON public.exam_attempts (student_id, exam_config_id)
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_exam_attempts_submitted_at
                ON public.exam_attempts (submitted_at)
                """);
    }
}
