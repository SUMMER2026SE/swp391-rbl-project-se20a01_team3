CREATE TABLE IF NOT EXISTS reward_point_transactions (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_type TEXT        NOT NULL
                                 CHECK (transaction_type IN ('EXAM_REWARD', 'VOUCHER_REDEMPTION')),
    points_delta     INTEGER     NOT NULL CHECK (points_delta <> 0),
    reference_id     UUID,
    title            TEXT        NOT NULL,
    description      TEXT,
    score_percent    NUMERIC(5,1),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_point_transactions_student_created
    ON reward_point_transactions(student_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reward_point_transaction_voucher
    ON reward_point_transactions(reference_id)
    WHERE transaction_type = 'VOUCHER_REDEMPTION' AND reference_id IS NOT NULL;

-- Tạo lịch sử ban đầu cho dữ liệu đã phát sinh trước migration.
INSERT INTO reward_point_transactions (
    student_id,
    transaction_type,
    points_delta,
    reference_id,
    title,
    description,
    score_percent,
    created_at
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
FROM student_reward_sources source
LEFT JOIN exam_configs exam ON exam.id = source.assessment_id
LEFT JOIN courses course ON course.id = exam.course_id
WHERE source.assessment_type = 'EXAM'
  AND source.awarded_points > 0
  AND NOT EXISTS (
      SELECT 1
      FROM reward_point_transactions tx
      WHERE tx.student_id = source.student_id
        AND tx.transaction_type = 'EXAM_REWARD'
        AND tx.reference_id = source.assessment_id
  );

INSERT INTO reward_point_transactions (
    student_id,
    transaction_type,
    points_delta,
    reference_id,
    title,
    description,
    created_at
)
SELECT
    student_voucher.student_id,
    'VOUCHER_REDEMPTION',
    -voucher.required_points,
    student_voucher.id,
    voucher.display_name,
    voucher.code,
    student_voucher.redeemed_at
FROM student_reward_vouchers student_voucher
JOIN reward_vouchers voucher ON voucher.id = student_voucher.voucher_id
WHERE NOT EXISTS (
    SELECT 1
    FROM reward_point_transactions tx
    WHERE tx.transaction_type = 'VOUCHER_REDEMPTION'
      AND tx.reference_id = student_voucher.id
);
