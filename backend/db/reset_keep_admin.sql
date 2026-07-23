-- ============================================================================
--  RESET DỮ LIỆU — GIỮ LẠI TÀI KHOẢN ADMIN
--
--  Mục tiêu: xóa sạch khóa học, doanh thu, người dùng (student/teacher/parent)
--  và toàn bộ dữ liệu nghiệp vụ để đưa hệ thống về "clean slate", CHỈ giữ:
--    - Tài khoản admin  (public.profiles.role = 'admin' + auth.users tương ứng)
--    - categories       (danh mục khóa học — dữ liệu tham chiếu)
--    - system_settings  (cấu hình hệ thống)
--
--  ⚠️  KHÔNG THỂ HOÀN TÁC. Bắt buộc backup trước (Dashboard → Database → Backups
--      hoặc pg_dump) rồi mới chạy phần XÓA.
--
--  SCHEMA: profiles KHÔNG có cột email — email nằm ở auth.users (GoTrue),
--  liên kết qua id (profiles.id = auth.users.id).
--
--  CÁCH DÙNG trên Supabase SQL Editor:
--    B1) Chạy BƯỚC 1 (preview) — xác nhận số liệu + đúng tài khoản admin cần giữ.
--    B2) Chạy BƯỚC 2 (khối BEGIN..COMMIT) — xóa dữ liệu nghiệp vụ.
--    B3) Chạy BƯỚC 3+4 (khối BEGIN..COMMIT) — xóa profile & auth.users ngoài admin.
--    B4) Dọn Storage theo BƯỚC 5 (thủ công trên Dashboard).
--    B5) Chạy BƯỚC 6 để kiểm tra.
-- ============================================================================


-- ── BƯỚC 1: PREVIEW (không xóa gì) ──────────────────────────────────────────
-- Xác nhận phạm vi trước khi xóa. Nếu số admin = 0 → DỪNG, kiểm tra lại.
SELECT role, count(*) AS so_luong FROM public.profiles GROUP BY role ORDER BY role;
SELECT count(*) AS so_khoa_hoc        FROM public.courses;
SELECT count(*) AS so_giao_dich_dthu  FROM public.revenue_splits;
SELECT count(*) AS so_don_hang        FROM public.orders;

-- Danh sách admin sẽ được GIỮ LẠI:
SELECT p.id, u.email, p.full_name, p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at;


-- ── BƯỚC 2: XÓA DỮ LIỆU NGHIỆP VỤ (TRUNCATE ... CASCADE) ────────────────────
-- Guard: nếu không có admin nào thì RAISE EXCEPTION → cả transaction rollback,
-- tránh trường hợp xóa sạch rồi mới phát hiện mất luôn admin.
BEGIN;

DO $$
BEGIN
    IF (SELECT count(*) FROM public.profiles WHERE role = 'admin') = 0 THEN
        RAISE EXCEPTION 'HUY: khong tim thay tai khoan admin nao — dung de tranh xoa nham toan bo.';
    END IF;
END $$;

TRUNCATE TABLE

    revenue_splits, payout_periods, order_items, orders,
    teacher_bank_accounts, teacher_bank_audit_log,
   
    certificates,
    student_reward_vouchers, reward_vouchers, student_reward_sources, student_reward_balances,

    assignment_submissions, assignments, grade_audit_logs,
    exam_integrity_events, exam_ai_audit_logs, exam_retake_audit_logs,
    exam_retake_requests, exam_attempts, exam_configs,
    quiz_attempts, quiz_configs,
    question_audit_logs, question_versions, question_choices, questions, question_banks,
    
    course_progress_items, student_video_progress, student_document_downloads, student_lesson_notes,

    course_reviews, course_discussion_replies, course_discussion_threads, course_preview_views,

    enrollments,
  
    course_version_migration_logs, course_content_audit_logs, course_versions,

    lessons, chapters, course_documents, course_approval_history, courses,
   
    complaint_attachments, complaint_messages, complaints, qa_messages, qa_threads,
    
    parent_progress_access_audit, parent_link_audit_log, parent_student_links,
    
    admin_notifications, user_notifications
CASCADE;

COMMIT;
-- Ghi chú: CASCADE tự dọn bất kỳ bảng con nào tham chiếu bảng trong danh sách
-- mà lỡ bị bỏ sót (kèm NOTICE). categories / system_settings / profiles KHÔNG
-- bị liệt kê và không bị bảng nào ở trên tham chiếu ngược → được giữ nguyên.


-- ── BƯỚC 3 + 4: XÓA PROFILE & AUTH.USERS NGOÀI ADMIN ────────────────────────
-- Sau BƯỚC 2 mọi bảng tham chiếu profiles đã trống nên không bị chặn FK.
BEGIN;

-- Xóa toàn bộ profile không phải admin (student / teacher / parent + seed teachers)
DELETE FROM public.profiles WHERE role <> 'admin';

-- (TÙY CHỌN) Chỉ giữ ĐÚNG 1 admin theo email — bỏ comment và điền email nếu cần:
-- DELETE FROM public.profiles
-- WHERE id IN (SELECT id FROM auth.users WHERE email <> 'admin@beeacademy.local')
--   AND role = 'admin';

-- Xóa bản ghi đăng nhập (GoTrue) của mọi tài khoản không còn profile.
-- Tự cascade sang auth.sessions / auth.identities / auth.refresh_tokens.
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

COMMIT;


-- ── BƯỚC 5: DỌN SUPABASE STORAGE (thủ công — SQL không xóa file được) ────────
-- Trên Dashboard → Storage → chọn bucket → Empty bucket:
--   - course-videos           (video bài học, private)
--   - course-docs / documents (PDF, slide)
--   - avatars                 (giữ lại avatar admin nếu muốn, xóa phần còn lại)
-- Không dọn thì file cũ vẫn nằm trong Storage, tốn dung lượng và không còn bản
-- ghi nào trỏ tới.


-- ── BƯỚC 6: KIỂM TRA SAU KHI XÓA ────────────────────────────────────────────
SELECT
    (SELECT count(*) FROM public.profiles)        AS profiles_con_lai,   -- = số admin
    (SELECT count(*) FROM auth.users)             AS auth_users_con_lai, -- = số admin
    (SELECT count(*) FROM public.courses)         AS courses,            -- = 0
    (SELECT count(*) FROM public.orders)          AS orders,             -- = 0
    (SELECT count(*) FROM public.revenue_splits)  AS revenue_splits,     -- = 0
    (SELECT count(*) FROM public.enrollments)     AS enrollments,        -- = 0
    (SELECT count(*) FROM public.categories)      AS categories_giu,     -- > 0 (giữ)
    (SELECT count(*) FROM public.system_settings) AS system_settings_giu;-- giữ nguyên
