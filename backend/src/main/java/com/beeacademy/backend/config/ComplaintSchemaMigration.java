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
public class ComplaintSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        Boolean hasProfilesTable = jdbcTemplate.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = 'profiles'
                )
                """, Boolean.class);

        if (!Boolean.TRUE.equals(hasProfilesTable)) {
            return;
        }

        log.info("Ensuring complaints tables exist");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS public.complaints (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
                    sender_role user_role NOT NULL,
                    title TEXT NOT NULL,
                    category VARCHAR(40) NOT NULL,
                    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
                    status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    closed_at TIMESTAMPTZ NULL,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    CONSTRAINT chk_complaints_priority
                        CHECK (priority IN ('low', 'medium', 'high')),
                    CONSTRAINT chk_complaints_status
                        CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
                    CONSTRAINT chk_complaints_category
                        CHECK (category IN (
                            'payment', 'course_review', 'bank_verify', 'student_report',
                            'technical', 'other', 'course_content', 'teacher', 'grading',
                            'parent_link', 'content', 'system'
                        ))
                )
                """);
        jdbcTemplate.execute("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS sender_id UUID");
        jdbcTemplate.execute("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS sender_role user_role");
        jdbcTemplate.execute("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS title TEXT");
        jdbcTemplate.execute("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS category VARCHAR(40)");
        jdbcTemplate.execute("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'medium'");
        jdbcTemplate.execute("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'");
        jdbcTemplate.execute("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
        jdbcTemplate.execute("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
        jdbcTemplate.execute("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ NULL");
        jdbcTemplate.execute("ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
        jdbcTemplate.execute("""
                UPDATE public.complaints c
                SET sender_role = p.role
                FROM public.profiles p
                WHERE c.sender_id = p.id
                  AND c.sender_role IS NULL
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_complaints_sender_id
                ON public.complaints (sender_id)
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_complaints_status
                ON public.complaints (status)
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_complaints_last_activity
                ON public.complaints (last_activity_at DESC)
                """);

        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS public.complaint_messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
                    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
                    author_role user_role NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """);
        jdbcTemplate.execute("ALTER TABLE public.complaint_messages ADD COLUMN IF NOT EXISTS complaint_id UUID");
        jdbcTemplate.execute("ALTER TABLE public.complaint_messages ADD COLUMN IF NOT EXISTS author_id UUID");
        jdbcTemplate.execute("ALTER TABLE public.complaint_messages ADD COLUMN IF NOT EXISTS author_role user_role");
        jdbcTemplate.execute("ALTER TABLE public.complaint_messages ADD COLUMN IF NOT EXISTS content TEXT");
        jdbcTemplate.execute("ALTER TABLE public.complaint_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
        jdbcTemplate.execute("""
                UPDATE public.complaint_messages m
                SET author_role = p.role
                FROM public.profiles p
                WHERE m.author_id = p.id
                  AND m.author_role IS NULL
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_complaint_messages_complaint_id
                ON public.complaint_messages (complaint_id)
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_complaint_messages_created_at
                ON public.complaint_messages (created_at ASC)
                """);
    }
}
