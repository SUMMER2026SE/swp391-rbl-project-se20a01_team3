-- Điểm thưởng chỉ được tạo từ bài kiểm tra. Loại bỏ các giao dịch điều chỉnh
-- từng dùng để bù theo số dư cũ vì chúng làm điểm khả dụng bị cộng trùng.
DELETE FROM reward_point_transactions
WHERE transaction_type = 'BALANCE_ADJUSTMENT';

UPDATE student_reward_balances AS balance
SET lifetime_points = totals.exam_points,
    available_points = GREATEST(0, totals.exam_points - totals.spent_points),
    updated_at = NOW()
FROM (
    SELECT
        balance_source.student_id,
        COALESCE((
            SELECT SUM(source.awarded_points)
            FROM student_reward_sources source
            WHERE source.student_id = balance_source.student_id
              AND source.assessment_type = 'EXAM'
        ), 0)::INTEGER AS exam_points,
        COALESCE((
            SELECT SUM(-tx.points_delta)
            FROM reward_point_transactions tx
            WHERE tx.student_id = balance_source.student_id
              AND tx.transaction_type = 'VOUCHER_REDEMPTION'
        ), 0)::INTEGER AS spent_points
    FROM student_reward_balances balance_source
) totals
WHERE balance.student_id = totals.student_id;
