package com.beeacademy.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runtime fallback vì thư mục backend/db/migrations hiện chưa được tự động chạy
 * trong các môi trường triển khai cũ.
 */
@Component
@RequiredArgsConstructor
public class RewardPointHistorySchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS public.reward_point_transactions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
                    transaction_type TEXT NOT NULL
                        CHECK (transaction_type IN ('EXAM_REWARD', 'VOUCHER_REDEMPTION')),
                    points_delta INTEGER NOT NULL CHECK (points_delta <> 0),
                    reference_id UUID,
                    title TEXT NOT NULL,
                    description TEXT,
                    score_percent NUMERIC(5,1),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """);
        jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_reward_point_transactions_student_created
                ON public.reward_point_transactions(student_id, created_at DESC)
                """);
        jdbcTemplate.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_reward_point_transaction_voucher
                ON public.reward_point_transactions(reference_id)
                WHERE transaction_type = 'VOUCHER_REDEMPTION' AND reference_id IS NOT NULL
                """);
        backfillExamRewards();
        backfillVoucherRedemptions();
    }

    private void backfillExamRewards() {
        jdbcTemplate.update("""
                INSERT INTO public.reward_point_transactions (
                    student_id, transaction_type, points_delta, reference_id,
                    title, description, score_percent, created_at
                )
                SELECT
                    source.student_id,
                    'EXAM_REWARD',
                    source.awarded_points,
                    source.assessment_id,
                    COALESCE(exam.name, 'Bài kiểm tra'),
                    course.title,
                    source.best_score_percent,
                    source.updated_at
                FROM public.student_reward_sources source
                LEFT JOIN public.exam_configs exam ON exam.id = source.assessment_id
                LEFT JOIN public.courses course ON course.id = exam.course_id
                WHERE source.assessment_type = 'EXAM'
                  AND source.awarded_points > 0
                  AND NOT EXISTS (
                      SELECT 1
                      FROM public.reward_point_transactions tx
                      WHERE tx.student_id = source.student_id
                        AND tx.transaction_type = 'EXAM_REWARD'
                        AND tx.reference_id = source.assessment_id
                  )
                """);
    }

    private void backfillVoucherRedemptions() {
        jdbcTemplate.update("""
                INSERT INTO public.reward_point_transactions (
                    student_id, transaction_type, points_delta, reference_id,
                    title, description, created_at
                )
                SELECT
                    student_voucher.student_id,
                    'VOUCHER_REDEMPTION',
                    -voucher.required_points,
                    student_voucher.id,
                    voucher.display_name,
                    voucher.code,
                    student_voucher.redeemed_at
                FROM public.student_reward_vouchers student_voucher
                JOIN public.reward_vouchers voucher ON voucher.id = student_voucher.voucher_id
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM public.reward_point_transactions tx
                    WHERE tx.transaction_type = 'VOUCHER_REDEMPTION'
                      AND tx.reference_id = student_voucher.id
                )
                """);
    }
}
