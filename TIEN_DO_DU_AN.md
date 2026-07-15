# Báo cáo tiến độ dự án Bee Academy theo SRS 4.14

Tài liệu này cập nhật tiến độ theo `SRS_4.14_final.docx` và code hiện tại trong workspace.

Ngày cập nhật: 15/07/2026

## 1. Quy ước đánh giá

| Ký hiệu | Ý nghĩa |
| --- | --- |
| ✅ Hoàn thành | UC đã hoàn thành hoặc gần như đầy đủ theo SRS. |
| 🟢 Trên 80% | UC đã có luồng chính tốt, còn thiếu test, audit, export hoặc vài acceptance criteria. |
| 🟡 Từ 50% trở lên | UC có nền tảng hoặc một phần luồng, cần bổ sung đáng kể. |
| 🔴 Dưới 50% | UC chưa có luồng chính hoặc mới ở mức placeholder. |

## 2. Tổng hợp theo module

| Module | Phạm vi UC | Mức hoàn thành ước lượng | Trạng thái chính |
| --- | --- | ---: | --- |
| Xác thực & Tài khoản | UC01-UC05 | ~76% | 🟡 Có auth/profile/OTP/reset; cần chuẩn hóa account_status, lock login, teacher approval state và audit. |
| Tìm kiếm & Khóa học | UC06-UC08 | ~87% | 🟢 Search/detail/free lesson đã có; cần test permission và trạng thái published/approved. |
| Mua hàng & Thanh toán | UC09-UC12 | ~78% | 🟡 Có PayOS/order/webhook/history/complaint; lệch gateway SRS và thiếu PaymentAttempt/refund/reconcile đầy đủ. |
| Học tập | UC13-UC20 | ~85% | 🟢 Có enrollment, lesson/document, assignment, exam, progress, review, certificate; còn thiếu vài rule nâng cao. |
| Tương tác & Hỗ trợ | UC21-UC23 | ~75% | 🟡 Q&A tốt; AI chat/roadmap có nhưng thiếu consent/opt-out/delete history đầy đủ. |
| Phụ huynh | UC24-UC29 | ~84% | 🟢 Parent portal có dashboard, progress, payment, message, link/consent/audit; UC29 lệch nghiệp vụ. |
| Giáo viên | UC30-UC37 | ~83% | 🟢 Teacher portal có course/content/question bank/exam/grading/Q&A/revenue; còn thiếu approved-gate toàn bộ, audit/export/versioning. |
| Admin | UC38-UC44 | ~79% | 🟡 Dashboard/user/course approval/complaint/payout/notification đã có; còn thiếu security/audit/reconcile nâng cao. |

## 3. Chi tiết theo module

### Module 1 - Xác thực & Tài khoản

| UC | Tên UC | % | Trạng thái | Ghi chú |
| --- | --- | ---: | --- | --- |
| UC01 | Đăng ký tài khoản | 75% | 🟡 Từ 50% trở lên | Có đăng ký/profile/OTP; cần chuẩn account state và audit. |
| UC02 | Đăng nhập hệ thống | 75% | 🟡 Từ 50% trở lên | Có login/role routing; cần lock 5 lần sai và audit. |
| UC03 | Đăng xuất hệ thống | 70% | 🟡 Từ 50% trở lên | Có clear session frontend; cần revoke server-side. |
| UC04 | Đặt lại mật khẩu | 80% | 🟡 Từ 50% trở lên | Có reset qua auth provider; cần rate limit/audit/session invalidation. |
| UC05 | Cập nhật hồ sơ cá nhân | 80% | 🟡 Từ 50% trở lên | Có profile/avatar/bank teacher; cần mã hóa/audit dữ liệu nhạy cảm. |

### Module 2 - Tìm kiếm & Khóa học

| UC | Tên UC | % | Trạng thái | Ghi chú |
| --- | --- | ---: | --- | --- |
| UC06 | Tìm kiếm khóa học | 90% | ✅ Hoàn thành | Search/filter public đã tốt; cần test published/approved. |
| UC07 | Xem chi tiết khóa học | 90% | ✅ Hoàn thành | Detail course đã tốt; cần test quyền private content. |
| UC08 | Xem bài học thử | 80% | 🟡 Từ 50% trở lên | Có free preview; cần test signed URL và chặn nội dung không free. |

### Module 3 - Mua hàng & Thanh toán

| UC | Tên UC | % | Trạng thái | Ghi chú |
| --- | --- | ---: | --- | --- |
| UC09 | Mua khóa học | 75% | 🟡 Từ 50% trở lên | Có order/checkout/enrollment; cần E2E phụ huynh mua cho con. |
| UC10 | Thanh toán khóa học | 70% | 🟡 Từ 50% trở lên | Có PayOS/webhook/revenue split; thiếu PaymentAttempt/refund/reconcile. |
| UC11 | Xem lịch sử mua khóa học | 80% | 🟡 Từ 50% trở lên | Có history/order; cần hóa đơn pháp lý và filter nâng cao. |
| UC12 | Gửi khiếu nại đến Admin | 85% | 🟢 Trên 80% | Có complaint user/admin; cần gắn refund/payment dispute. |

### Module 4 - Học tập

| UC | Tên UC | % | Trạng thái | Ghi chú |
| --- | --- | ---: | --- | --- |
| UC13 | Xem danh sách khóa học đã mua | 90% | ✅ Hoàn thành | Có my courses/enrollment; cần test revoke/refund. |
| UC14 | Xem bài giảng & tài liệu | 85% | 🟢 Trên 80% | Có lesson/document/progress; cần rule watched segment/HLS. |
| UC15 | Tải tài liệu học tập | 85% | 🟢 Trên 80% | Có signed/download log; cần watermark/expiry policy. |
| UC16 | Nộp bài tập | 80% | 🟡 Từ 50% trở lên | Có submit/grading; cần late policy/resubmit limit. |
| UC17 | Làm bài kiểm tra | 85% | 🟢 Trên 80% | Có exam/autosave/scoring/retake; cần anti-cheat E2E. |
| UC18 | Xem điểm & tiến độ học tập | 85% | 🟢 Trên 80% | Có progress/score; cần SLA và course version rule. |
| UC19 | Đánh giá khóa học | 85% | 🟢 Trên 80% | Có review/summary; cần moderation/spam/audit. |
| UC20 | Xem & tải chứng chỉ | 88% | 🟢 Trên 80% | Có PDF/QR/verify/signed URL; cần E2E điều kiện 4 bài. |

### Module 5 - Tương tác & Hỗ trợ

| UC | Tên UC | % | Trạng thái | Ghi chú |
| --- | --- | ---: | --- | --- |
| UC21 | Gửi câu hỏi cho giáo viên | 85% | 🟢 Trên 80% | Có Q&A/attachment/notify; cần visibility/moderation/retention. |
| UC22 | Chat AI hỗ trợ | 70% | 🟡 Từ 50% trở lên | Có AI tutor; thiếu consent/opt-out/delete history. |
| UC23 | Nhận đề xuất lộ trình từ AI | 70% | 🟡 Từ 50% trở lên | Có roadmap AI; thiếu consent/audit/giải thích đề xuất. |

### Module 6 - Phụ huynh

| UC | Tên UC | % | Trạng thái | Ghi chú |
| --- | --- | ---: | --- | --- |
| UC24 | Theo dõi tiến độ học tập của con | 85% | 🟢 Trên 80% | Có parent report/consent/audit; cần SLA/export. |
| UC25 | Liên hệ & nhận thông báo từ GV | 85% | 🟢 Trên 80% | Có parent-teacher message; cần giới hạn ký tự/moderation/retention. |
| UC26 | Xem lịch sử thanh toán khóa học | 80% | 🟡 Từ 50% trở lên | Có payment history theo con; cần hóa đơn pháp lý. |
| UC27 | Gửi lời mời liên kết con | 95% | ✅ Hoàn thành | Gần đủ SRS; cần E2E email/in-app. |
| UC28 | Chấp nhận / từ chối liên kết | 90% | ✅ Hoàn thành | Gần đủ SRS; cần thống nhất ACTIVE/ACCEPTED. |
| UC29 | Hủy liên kết tài khoản | 70% | 🟡 Từ 50% trở lên | Có request/confirm; lệch SRS hủy một phía. |

### Module 7 - Giáo viên

| UC | Tên UC | % | Trạng thái | Ghi chú |
| --- | --- | ---: | --- | --- |
| UC30 | Tạo khóa học mới | 80% | 🟡 Từ 50% trở lên | Có draft/submit/4 chương/4 exam/version; cần approved-teacher gate. |
| UC31 | Cập nhật bài giảng & tài liệu | 70% | 🟡 Từ 50% trở lên | Có chapter/lesson/upload/version; thiếu HLS/audit/completion_rule đầy đủ. |
| UC32 | Tạo question bank | 95% | ✅ Hoàn thành | Gần đủ SRS; cần E2E/UI test. |
| UC33 | Cập nhật question bank | 80% | 🟡 Từ 50% trở lên | Có CRUD/import/version; cần audit old/new/action và gate approved. |
| UC34 | Tạo bài kiểm tra | 85% | 🟢 Trên 80% | Có 4 slot/scope/AI/autosave; cần course_version_id và anti-cheat enforcement. |
| UC35 | Chấm điểm bài tập và câu tự luận | 82% | 🟢 Trên 80% | Có grading/audit/retake; cần schema retake/cooldown chuẩn. |
| UC36 | Trả lời câu hỏi học sinh | 90% | ✅ Hoàn thành | Gần đủ SRS; cần test visibility/KPI UI. |
| UC37 | Xem lịch sử doanh thu | 85% | 🟢 Trên 80% | Có period paid/CSV/UNC; cần Excel pháp lý/retention. |

### Module 8 - Admin

| UC | Tên UC | % | Trạng thái | Ghi chú |
| --- | --- | ---: | --- | --- |
| UC38 | Xem dashboard quản trị | 85% | 🟢 Trên 80% | Có dashboard/KPI; cần reconcile/export. |
| UC39 | Xem danh sách tài khoản người dùng | 80% | 🟡 Từ 50% trở lên | Có user list/filter; cần export/audit/teacher state chuẩn. |
| UC40 | Cập nhật tài khoản người dùng | 65% | 🟡 Từ 50% trở lên | Có nền admin/profile; thiếu khóa/mở, role, audit/security đầy đủ. |
| UC41 | Duyệt khóa học | 80% | 🟡 Từ 50% trở lên | Có approve/reject/revision; cần checklist/audit/diff version. |
| UC42 | Xử lý khiếu nại từ người dùng | 85% | 🟢 Trên 80% | Có xử lý complaint; cần refund/payment dispute/SLA. |
| UC43 | Xuất danh sách chi trả và xác nhận đã chuyển khoản GV | 80% | 🟡 Từ 50% trở lên | Có payout confirm/metadata; cần Excel/chứng từ/state machine. |
| UC44 | Gửi thông báo đến người dùng | 80% | 🟡 Từ 50% trở lên | Có notification; cần schedule/template/email-push/audit broadcast. |

## 4. Ưu tiên làm tiếp

1. Hoàn thiện các điểm lệch SRS lớn: PayOS/VNPay-MoMo, trạng thái `ACTIVE`/`ACCEPTED`, UC29 hủy liên kết, teacher approved gate.
2. Bổ sung payment/refund/reconciliation và hóa đơn pháp lý cho UC09-UC11, UC26, UC42.
3. Hoàn thiện audit/versioning/export cho course content, question bank, grading, payout và admin user action.
4. Bổ sung consent/opt-out/delete history cho AI UC22-UC23.
5. Viết E2E/system test cho các luồng trọng yếu: thanh toán, chứng chỉ, parent link, 4 bài kiểm tra cố định, payout admin.
