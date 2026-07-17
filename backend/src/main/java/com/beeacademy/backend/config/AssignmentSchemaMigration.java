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
public class AssignmentSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        Boolean hasCoursesTable = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'courses'
                )
                """, Boolean.class);
        if (!Boolean.TRUE.equals(hasCoursesTable)) return;

        log.info("Ensuring UC16 assignment policy columns and indexes exist");
        jdbcTemplate.execute("""
                ALTER TABLE public.assignments
                ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 3
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.assignments
                ADD COLUMN IF NOT EXISTS allow_late_submission BOOLEAN NOT NULL DEFAULT FALSE
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.assignments
                ADD COLUMN IF NOT EXISTS late_penalty_percent INTEGER NOT NULL DEFAULT 0
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.assignments
                ADD COLUMN IF NOT EXISTS accepting_submissions BOOLEAN NOT NULL DEFAULT TRUE
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.assignment_submissions
                ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.assignment_submissions
                ADD COLUMN IF NOT EXISTS late BOOLEAN NOT NULL DEFAULT FALSE
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.assignment_submissions
                ADD COLUMN IF NOT EXISTS late_penalty_percent INTEGER NOT NULL DEFAULT 0
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.assignment_submissions
                ADD COLUMN IF NOT EXISTS raw_score INTEGER
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.assignment_submissions
                ADD COLUMN IF NOT EXISTS expected_graded_by TIMESTAMPTZ
                """);
        jdbcTemplate.execute("""
                UPDATE public.assignment_submissions
                SET expected_graded_by = submitted_at + INTERVAL '7 days'
                WHERE expected_graded_by IS NULL
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.assignment_submissions
                ALTER COLUMN expected_graded_by SET NOT NULL
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_assignments_chapter
                ON public.assignments (chapter_id)
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_assignments_lesson
                ON public.assignments (lesson_id)
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment
                ON public.assignment_submissions (assignment_id)
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status
                ON public.assignment_submissions (status)
                """);
    }
}
