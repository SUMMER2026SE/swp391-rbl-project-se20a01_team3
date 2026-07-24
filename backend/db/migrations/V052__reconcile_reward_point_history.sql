ALTER TABLE reward_point_transactions
    ADD COLUMN IF NOT EXISTS adjustment_key TEXT;

ALTER TABLE reward_point_transactions
    DROP CONSTRAINT IF EXISTS reward_point_transactions_transaction_type_check;

ALTER TABLE reward_point_transactions
    ADD CONSTRAINT reward_point_transactions_transaction_type_check
    CHECK (transaction_type IN ('EXAM_REWARD', 'VOUCHER_REDEMPTION', 'BALANCE_ADJUSTMENT'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_reward_point_transaction_adjustment
    ON reward_point_transactions(adjustment_key)
    WHERE adjustment_key IS NOT NULL;

-- Xóa bản đối soát cũ để phép đối soát luôn phản ánh số dư hiện tại.
DELETE FROM reward_point_transactions
WHERE adjustment_key LIKE 'LIFETIME:%'
   OR adjustment_key LIKE 'AVAILABLE:%';

-- Bù phần tổng điểm đã nhận nhưng lịch sử chưa có giao dịch tương ứng.
INSERT INTO reward_point_transactions (
    student_id, transaction_type, points_delta, title, description,
    adjustment_key, created_at
)
SELECT
    balance.student_id,
    'BALANCE_ADJUSTMENT',
    balance.lifetime_points - COALESCE((
        SELECT SUM(GREATEST(tx.points_delta, 0))
        FROM reward_point_transactions tx
        WHERE tx.student_id = balance.student_id
    ), 0),
    'Điểm tích lũy trước khi ghi lịch sử',
    'Đối soát từ số dư điểm hiện tại',
    'LIFETIME:' || balance.student_id,
    NOW()
FROM student_reward_balances balance
WHERE balance.lifetime_points > COALESCE((
    SELECT SUM(GREATEST(tx.points_delta, 0))
    FROM reward_point_transactions tx
    WHERE tx.student_id = balance.student_id
), 0);

-- Bù phần chênh lệch để tổng giao dịch (cộng - trừ) đúng bằng điểm khả dụng.
INSERT INTO reward_point_transactions (
    student_id, transaction_type, points_delta, title, description,
    adjustment_key, created_at
)
SELECT
    balance.student_id,
    'BALANCE_ADJUSTMENT',
    balance.available_points - COALESCE((
        SELECT SUM(tx.points_delta)
        FROM reward_point_transactions tx
        WHERE tx.student_id = balance.student_id
    ), 0),
    'Điều chỉnh điểm khả dụng',
    'Đối soát từ số dư điểm hiện tại',
    'AVAILABLE:' || balance.student_id,
    NOW()
FROM student_reward_balances balance
WHERE balance.available_points <> COALESCE((
    SELECT SUM(tx.points_delta)
    FROM reward_point_transactions tx
    WHERE tx.student_id = balance.student_id
), 0);
