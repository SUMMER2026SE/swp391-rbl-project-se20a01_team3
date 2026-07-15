# Kế hoạch chia việc theo Use Case - Bee Academy SRS 4.14

Mục tiêu: mỗi thành viên sở hữu một cụm UC end-to-end, gồm bảo trì phần đã có, bổ sung phần còn thiếu, viết test và xử lý lỗi theo SRS 4.14.

## 1. Trạng thái triển khai thực tế

| Module | UC | Mức hoàn thành | Ghi chú chính |
| --- | --- | ---: | --- |
| AUTH | UC01-UC05 | ~76% | Có auth/profile/reset; cần chuẩn hóa account_status, lock login, teacher approval state. |
| CRS | UC06-UC08 | ~87% | Search/detail/free lesson đã có, cần test permission/published state. |
| PAY | UC09-UC12 | ~78% | Có PayOS/order/revenue/complaint; lệch VNPay/MoMo và thiếu state machine payment nâng cao. |
| LRN | UC13-UC20 | ~85% | Có learning/exam/assignment/review/certificate; còn thiếu rule nâng cao và E2E. |
| INT | UC21-UC23 | ~75% | Q&A tốt; AI chat/roadmap cần consent/opt-out/delete history. |
| PRN | UC24-UC29 | ~84% | Parent portal mạnh; còn export/policy và UC29 lệch nghiệp vụ. |
| TCH | UC30-UC37 | ~83% | Teacher portal mạnh; còn approved-gate toàn bộ, audit/export/versioning. |
| ADM | UC38-UC44 | ~79% | Admin có nhiều luồng chính; còn security/audit/reconcile nâng cao. |

## 2. Phân công 5 thành viên

| Thành viên | Vai trò | UC sở hữu chính | Trọng tâm tiếp theo |
| --- | --- | --- | --- |
| TV1 - Thành Đạt | Chủ trì kỹ thuật, auth, payment, notification, payout | UC01-05, UC09-11, UC37, UC43, UC44 | Chuẩn hóa auth/account state; đồng bộ PayOS/SRS; hoàn thiện PaymentAttempt/refund/reconcile; export payout Excel; notification/broadcast; hỗ trợ migration và merge. |
| TV2 | Khóa học, học tập, tài liệu, chứng chỉ | UC06-08, UC13-15, UC19-20 | Củng cố search/detail/free preview; signed URL/watermark tài liệu; certificate PDF/QR; review moderation/test. |
| TV3 | Khảo thí, assignment, progress, Q&A/AI | UC16-18, UC21-23, UC35-36 | Hoàn thiện assignment late policy, exam unlock/anti-cheat, retake schema, AI chat/roadmap consent và Q&A visibility. |
| TV4 | Giáo viên authoring + Phụ huynh | UC24-29, UC30-34 | Phủ approved-teacher gate, audit/versioning khóa học, completion_rule lesson, parent report/export, thống nhất UC29. |
| TV5 | Admin, khiếu nại, user governance | UC12, UC38-44, hỗ trợ UC26 | Admin security/audit, teacher approval workflow, complaint-refund linkage, dashboard/report/export. |

## 3. Chi tiết phân công theo UC

| UC | Chủ sở hữu | % hiện tại | Việc còn lại |
| --- | --- | ---: | --- |
| UC01 | TV1 | 75% | Chuẩn hóa account/profile state, chống spam/duplicate nâng cao, audit đăng ký. |
| UC02 | TV1 | 75% | Lock 5 lần sai/15 phút, audit login, chặn BLOCKED/SUSPENDED nhất quán. |
| UC03 | TV1 | 70% | Revoke session server-side, audit logout, logout mọi thiết bị nếu cần. |
| UC04 | TV1 | 80% | Rate limit, audit, vô hiệu hóa session cũ sau reset. |
| UC05 | TV1 + TV5 | 80% | Mã hóa/audit dữ liệu nhạy cảm, teacher profile state, bank verification. |
| UC06 | TV2 | 90% | Test phân trang/filter và rule chỉ hiển thị khóa published/approved. |
| UC07 | TV2 | 90% | Test quyền xem detail/nội dung private với guest và user chưa mua. |
| UC08 | TV2 | 80% | Test `isFree`, signed URL, chặn tài liệu/video không free. |
| UC09 | TV1 | 75% | E2E phụ huynh mua cho con, duplicate purchase, cancel/expire order. |
| UC10 | TV1 | 70% | Thống nhất PayOS thay VNPay/MoMo, thêm PaymentAttempt/refund/reconcile. |
| UC11 | TV1 + TV2 | 80% | Hóa đơn PDF/e-invoice, filter nâng cao, liên kết refund. |
| UC12 | TV5 | 85% | Gắn complaint với payment/refund, SLA, evidence attachment/audit. |
| UC13 | TV2 | 90% | Test revoke/refund enrollment và course version sau cập nhật. |
| UC14 | TV2 | 85% | Unique watched segments, HLS/video processing, chống tua nếu cần. |
| UC15 | TV2 | 85% | Watermark/expiry policy, báo cáo download, test quyền truy cập. |
| UC16 | TV3 | 80% | Late policy, số lần nộp, resubmit window, deadline notification. |
| UC17 | TV3 | 85% | E2E 4 bài cố định, anti-cheat enforcement, ExamEnrollment/RetakeApproval. |
| UC18 | TV3 | 85% | SLA cập nhật progress/score, chuẩn hóa điểm theo course version. |
| UC19 | TV2 | 85% | Moderation/spam rule, điều kiện review, audit edit/delete. |
| UC20 | TV2 | 88% | E2E điều kiện cấp chứng chỉ theo 4 bài, kiểm render/template. |
| UC21 | TV3 | 85% | Visibility public/private, moderation, retention. |
| UC22 | TV3 | 70% | Consent/opt-out/delete history, fallback, rate limit, logging. |
| UC23 | TV3 | 70% | Không gửi dữ liệu khi rút consent, giải thích đề xuất, lưu/xóa lịch sử. |
| UC24 | TV4 | 85% | Test báo cáo 4 bài kiểm tra, SLA cập nhật <= 5 phút, export báo cáo tuần. |
| UC25 | TV4 + TV3 | 85% | Enforce 2000 ký tự, moderation flow, retention chat 12 tháng. |
| UC26 | TV5 + TV1 | 80% | Hóa đơn pháp lý/PDF, liên kết rõ với order/refund/reconcile. |
| UC27 | TV4 | 95% | Bổ sung E2E email/in-app. |
| UC28 | TV4 | 90% | Thống nhất `ACTIVE`/`ACCEPTED`, thêm E2E. |
| UC29 | TV4 | 70% | Chốt nghiệp vụ hủy một phía hay hai phía, thêm lý do hủy. |
| UC30 | TV4 | 80% | Gate approved teacher cho TeacherCourseService, version migration. |
| UC31 | TV4 + TV2 | 70% | HLS encode, video retention, audit change_type, completion_rule. |
| UC32 | TV4 | 95% | E2E/UI test. |
| UC33 | TV4 + TV3 | 80% | Approved gate trong QuestionService, audit old/new/action. |
| UC34 | TV3 + TV4 | 85% | `course_version_id`, anti-cheat enforcement, test coverage phạm vi 4 bài. |
| UC35 | TV3 | 82% | RetakeApproval/ExamEnrollment đúng SRS, cooldown, audit schema đầy đủ. |
| UC36 | TV3 | 90% | Test visibility public/private, UI KPI report. |
| UC37 | TV1 | 85% | Export Excel pháp lý, retention 5 năm, thống nhất `PAID`/`CONFIRMED`. |
| UC38 | TV5 | 85% | Reconcile số liệu, export dashboard, kiểm số tiền giữ/phải chuyển. |
| UC39 | TV5 | 80% | Pagination/export Excel, teacher_profile_state chuẩn, audit truy cập. |
| UC40 | TV5 + TV1 | 65% | Khóa/mở khóa, đổi role, reset password, thu hồi GV, audit/security rule. |
| UC41 | TV5 + TV4 | 80% | Checklist review, audit decision, diff version, gate GV approved. |
| UC42 | TV5 | 85% | Tích hợp refund/payment dispute, SLA, evidence attachment. |
| UC43 | TV1 + TV5 | 80% | Export Excel/chứng từ pháp lý, upload UNC, state machine payout/retry/audit. |
| UC44 | TV1 + TV5 | 80% | Schedule, email/push, template, audit broadcast. |

## 4. Quy tắc sở hữu schema

| Entity/nhóm bảng | Chủ sở hữu | Ghi chú |
| --- | --- | --- |
| `profiles`, auth, role/approval | TV1 + TV5 | Mọi thay đổi role/teacher approval cần audit và review chung. |
| `courses`, `chapters`, `lessons`, `course_versions` | TV4 | TV2/TV3 đọc qua API, không sửa schema trực tiếp nếu chưa thống nhất. |
| `exam_configs`, `exam_attempts`, `exam_retake_requests` | TV3 | Liên quan UC17/34/35/certificate. |
| `question_banks`, `questions`, `question_versions` | TV4 + TV3 | Cần thống nhất audit/versioning. |
| `parent_student_links`, parent audit/consent | TV4 | Liên quan privacy và UC24-29. |
| `orders`, `revenue_splits`, `payout_periods` | TV1 | TV5/TV4 chỉ dùng qua API/service. |
| `complaints`, admin actions | TV5 | Liên quan UC12/42/refund. |
| `notifications` | TV1 | Các module chỉ gọi service chung. |

## 5. Quy tắc làm việc

1. Branch theo UC hoặc cụm UC: `feature/uc24-parent-report`, `feature/uc34-fixed-exams`.
2. Migration SQL do TV1 kiểm tra thứ tự và tránh trùng version.
3. Mỗi UC cần tối thiểu 1 happy-path test và 1 negative test theo SRS.
4. File chung như `App.tsx`, `client.ts`, security config, enum chung cần báo TV1 trước khi sửa.
5. Trước khi báo cáo, chạy tối thiểu `mvn test`; nếu sửa frontend thì chạy thêm `npm run lint` hoặc `npm run build`.
