# Bee Academy - Use Case Specification theo SRS 4.14

Tổng cộng: **44 Use Case**, chia thành **8 module**, **7 actor**.

## 1. Actors

| ID | Actor | Loại | Mô tả |
| --- | --- | --- | --- |
| A01 | Guest | Primary | Người dùng chưa đăng nhập, xem nội dung công khai. |
| A02 | Học sinh | Primary | Mua khóa học, học theo tiến độ cá nhân, làm bài kiểm tra, nhận chứng chỉ. |
| A03 | Phụ huynh | Primary | Liên kết với học sinh để theo dõi tiến độ, thanh toán và liên hệ giáo viên. |
| A04 | Giáo viên | Primary | Tạo khóa học, bài giảng, question bank, bài kiểm tra, chấm bài, trả lời Q&A, xem lịch sử nhận tiền. |
| A05 | Admin | Primary | Quản trị người dùng, duyệt khóa, xử lý khiếu nại, xác nhận payout, gửi thông báo. |
| A06 | AI Engine | External | Hỗ trợ chat AI, đề xuất lộ trình, sinh câu hỏi theo chính sách. |
| A07 | Payment Gateway | External | Cổng thanh toán nhận giao dịch và gửi webhook về backend. |

## 2. Danh sách Use Case theo module

### Module 1 - Xác thực & Tài khoản

| UC | Tên Use Case | Actor |
| --- | --- | --- |
| UC01 | Đăng ký tài khoản | Guest |
| UC02 | Đăng nhập hệ thống | Học sinh, Phụ huynh, Giáo viên, Admin |
| UC03 | Đăng xuất hệ thống | Học sinh, Phụ huynh, Giáo viên, Admin |
| UC04 | Đặt lại mật khẩu | Guest |
| UC05 | Cập nhật hồ sơ cá nhân | Học sinh, Phụ huynh, Giáo viên |

### Module 2 - Tìm kiếm & Khóa học

| UC | Tên Use Case | Actor | Ghi chú |
| --- | --- | --- | --- |
| UC06 | Tìm kiếm khóa học | Guest | Lọc theo từ khóa, lĩnh vực, cấp lớp, giá. |
| UC07 | Xem chi tiết khóa học | Guest | Xem thông tin khóa public. |
| UC08 | Xem bài học thử | Guest | Extend UC07 khi bài học có `isFree = true`. |

### Module 3 - Mua hàng & Thanh toán

| UC | Tên Use Case | Actor | Ghi chú |
| --- | --- | --- | --- |
| UC09 | Mua khóa học | Học sinh, Phụ huynh | Include UC10. PH mua cho con đã liên kết ACTIVE. |
| UC10 | Thanh toán khóa học | Học sinh, Phụ huynh | Qua payment gateway; ghi order/payment/revenue split. |
| UC11 | Xem lịch sử mua khóa học | Học sinh, Phụ huynh | Lọc, xem chi tiết, hóa đơn. |
| UC12 | Gửi khiếu nại đến Admin | Học sinh, Phụ huynh | Liên quan UC42. |

### Module 4 - Học tập

| UC | Tên Use Case | Actor | Ghi chú |
| --- | --- | --- | --- |
| UC13 | Xem danh sách khóa học đã mua | Học sinh | Theo enrollment/course access. |
| UC14 | Xem bài giảng & tài liệu | Học sinh | Tính tiến độ học tập. |
| UC15 | Tải tài liệu học tập | Học sinh | Cần kiểm soát quyền, URL hết hạn, log tải. |
| UC16 | Nộp bài tập | Học sinh | Có deadline, file, số lần nộp, late policy. |
| UC17 | Làm bài kiểm tra | Học sinh | 4 bài kiểm tra mở theo tiến độ 100% trong phạm vi. |
| UC18 | Xem điểm & tiến độ học tập | Học sinh | Tổng hợp progress, quiz/exam/assignment. |
| UC19 | Đánh giá khóa học | Học sinh | Sau khi sở hữu/học khóa. |
| UC20 | Xem & tải chứng chỉ | Học sinh | Khi progress 100% và đạt điều kiện bài kiểm tra. |

### Module 5 - Tương tác & Hỗ trợ

| UC | Tên Use Case | Actor | Ghi chú |
| --- | --- | --- | --- |
| UC21 | Gửi câu hỏi cho giáo viên | Học sinh | Extend UC36. |
| UC22 | Chat AI hỗ trợ | Học sinh | Gọi AI Engine, có consent/opt-out/fallback. |
| UC23 | Nhận đề xuất lộ trình từ AI | Học sinh | Extend UC18, không gửi dữ liệu khi rút consent. |

### Module 6 - Phụ huynh

Các UC24, UC25, UC26 chỉ khả dụng khi liên kết PH-HS ở trạng thái ACTIVE.

| UC | Tên Use Case | Actor | Ghi chú SRS 4.14 |
| --- | --- | --- | --- |
| UC24 | Theo dõi tiến độ học tập của con | Phụ huynh | Hiển thị tiến độ, bài đã học, 4 bài kiểm tra Giữa kỳ 1/Cuối kỳ 1/Giữa kỳ 2/Cuối kỳ 2, bài nộp, chứng chỉ; tuân thủ privacy/consent. |
| UC25 | Liên hệ & nhận thông báo từ GV | Phụ huynh | Nhắn giáo viên của khóa con đã mua; nhận push/email. |
| UC26 | Xem lịch sử thanh toán khóa học | Phụ huynh | Giao dịch do PH hoặc HS thực hiện cho khóa của HS, kèm tiến độ hiện tại và hóa đơn. |
| UC27 | Gửi lời mời liên kết con | Phụ huynh | Nhập email HS, relationship/note; không tiết lộ email tồn tại hay không; lời mời hết hạn sau 7 ngày. |
| UC28 | Chấp nhận / từ chối liên kết | Học sinh | PENDING -> ACTIVE nếu chấp nhận, PENDING -> REJECTED nếu từ chối, PENDING -> EXPIRED nếu quá hạn. |
| UC29 | Hủy liên kết tài khoản | Học sinh, Phụ huynh | ACTIVE -> REVOKED; sau đó UC24/25/26 không còn khả dụng cho PH với HS đó. |

### Module 7 - Giáo viên

GV chỉ được dùng REQ-TCH-* khi tài khoản ACTIVE và vai trò Giáo viên đã được Admin phê duyệt.

| UC | Tên Use Case | Actor | Ghi chú SRS 4.14 |
| --- | --- | --- | --- |
| UC30 | Tạo khóa học mới | Giáo viên | Lưu nháp/gửi duyệt; tối thiểu 4 chương, mỗi chương có bài; đủ 4 bài kiểm tra hợp lệ, phạm vi liên tục và bao phủ toàn khóa. |
| UC31 | Cập nhật bài giảng & tài liệu | Giáo viên | Upload video/PDF/slide, cấu hình bài tập, completion_rule, versioning/audit khi ảnh hưởng học sinh. |
| UC32 | Tạo question bank | Giáo viên | Tạo bank ACTIVE, 0 câu hỏi, title unique theo GV. |
| UC33 | Cập nhật question bank | Giáo viên | Thêm/sửa/xóa/import câu hỏi; câu hỏi đã dùng phải version/archive, không phá lịch sử attempt. |
| UC34 | Tạo bài kiểm tra | Giáo viên | Tạo 4 bài: Giữa kỳ 1, Cuối kỳ 1, Giữa kỳ 2, Cuối kỳ 2; chọn start/end chapter; hỗ trợ trắc nghiệm/tự luận/AI draft. |
| UC35 | Chấm điểm bài tập và câu tự luận | Giáo viên, Admin | Chấm assignment/exam essay; sửa điểm trong 24h cần lý do; xử lý retake request. |
| UC36 | Trả lời câu hỏi học sinh | Giáo viên | Trả lời, sửa câu trả lời, đánh dấu trùng, thông báo học sinh. |
| UC37 | Xem lịch sử doanh thu | Giáo viên | Chỉ xem kỳ nhận tiền đã được Admin xác nhận, chứng từ/UNC, truy ngược giao dịch nguồn, export. |

### Module 8 - Quản trị viên

| UC | Tên Use Case | Actor | Ghi chú |
| --- | --- | --- | --- |
| UC38 | Xem dashboard quản trị | Admin | Tổng tiền đang giữ, tổng phải chuyển kỳ hiện tại, cảnh báo vận hành. |
| UC39 | Xem danh sách tài khoản người dùng | Admin | Tìm kiếm/lọc, account_status, teacher_profile_state. |
| UC40 | Cập nhật tài khoản người dùng | Admin | Khóa/mở khóa, đổi vai trò, reset password, phê duyệt/từ chối/thu hồi GV, audit/security rule. |
| UC41 | Duyệt khóa học | Admin | Approve / Reject / Needs Revision. |
| UC42 | Xử lý khiếu nại từ người dùng | Admin | Liên quan UC12, có trả lời/cập nhật trạng thái. |
| UC43 | Xuất danh sách chi trả và xác nhận đã chuyển khoản GV | Admin | Admin chuyển tay, xác nhận ngày CK/nội dung CK/chứng từ, thông báo GV. |
| UC44 | Gửi thông báo đến người dùng | Admin | Gửi đến học sinh, phụ huynh, giáo viên hoặc nhóm người dùng. |

## 3. Phụ lục tiến độ hiện tại theo UC

| UC | Tên Use Case | % hiện tại | Trạng thái ngắn |
| --- | --- | ---: | --- |
| UC01 | Đăng ký tài khoản | 75% | Có đăng ký/profile/OTP; cần chuẩn account state và audit. |
| UC02 | Đăng nhập hệ thống | 75% | Có login/role routing; cần lock 5 lần sai và audit. |
| UC03 | Đăng xuất hệ thống | 70% | Có clear session frontend; cần revoke server-side. |
| UC04 | Đặt lại mật khẩu | 80% | Có reset qua auth provider; cần rate limit/audit/session invalidation. |
| UC05 | Cập nhật hồ sơ cá nhân | 80% | Có profile/avatar/bank teacher; cần mã hóa/audit dữ liệu nhạy cảm. |
| UC06 | Tìm kiếm khóa học | 90% | Search/filter public đã tốt; cần test published/approved. |
| UC07 | Xem chi tiết khóa học | 90% | Detail course đã tốt; cần test quyền private content. |
| UC08 | Xem bài học thử | 80% | Có free preview; cần test signed URL và chặn nội dung không free. |
| UC09 | Mua khóa học | 75% | Có order/checkout/enrollment; cần E2E PH mua cho con. |
| UC10 | Thanh toán khóa học | 70% | Có PayOS/webhook/revenue split; thiếu PaymentAttempt/refund/reconcile. |
| UC11 | Xem lịch sử mua khóa học | 80% | Có history/order; cần hóa đơn pháp lý và filter nâng cao. |
| UC12 | Gửi khiếu nại đến Admin | 85% | Có complaint user/admin; cần gắn refund/payment dispute. |
| UC13 | Xem danh sách khóa học đã mua | 90% | Có my courses/enrollment; cần test revoke/refund. |
| UC14 | Xem bài giảng & tài liệu | 85% | Có lesson/document/progress; cần rule watched segment/HLS. |
| UC15 | Tải tài liệu học tập | 85% | Có signed/download log; cần watermark/expiry policy. |
| UC16 | Nộp bài tập | 80% | Có submit/grading; cần late policy/resubmit limit. |
| UC17 | Làm bài kiểm tra | 85% | Có exam/autosave/scoring/retake; cần anti-cheat E2E và ExamEnrollment. |
| UC18 | Xem điểm & tiến độ học tập | 85% | Có progress/score; cần SLA và course version rule. |
| UC19 | Đánh giá khóa học | 85% | Có review/summary; cần moderation/spam/audit. |
| UC20 | Xem & tải chứng chỉ | 88% | Có PDF/QR/verify/signed URL; cần E2E điều kiện 4 bài. |
| UC21 | Gửi câu hỏi cho giáo viên | 85% | Có Q&A/attachment/notify; cần visibility/moderation/retention. |
| UC22 | Chat AI hỗ trợ | 70% | Có AI tutor; thiếu consent/opt-out/delete history. |
| UC23 | Nhận đề xuất lộ trình từ AI | 70% | Có roadmap AI; thiếu consent/audit/giải thích đề xuất. |
| UC24 | Theo dõi tiến độ học tập của con | 85% | Có parent report/consent/audit; cần SLA/export. |
| UC25 | Liên hệ & nhận thông báo từ GV | 85% | Có parent-teacher message; cần giới hạn ký tự/moderation/retention. |
| UC26 | Xem lịch sử thanh toán khóa học | 80% | Có payment history theo con; cần hóa đơn pháp lý. |
| UC27 | Gửi lời mời liên kết con | 95% | Gần đủ SRS; cần E2E email/in-app. |
| UC28 | Chấp nhận / từ chối liên kết | 90% | Gần đủ SRS; cần thống nhất ACTIVE/ACCEPTED. |
| UC29 | Hủy liên kết tài khoản | 70% | Có request/confirm; lệch SRS hủy một phía. |
| UC30 | Tạo khóa học mới | 80% | Có draft/submit/4 chương/4 exam/version; cần approved-teacher gate. |
| UC31 | Cập nhật bài giảng & tài liệu | 70% | Có chapter/lesson/upload/version; thiếu HLS/audit/completion_rule đầy đủ. |
| UC32 | Tạo question bank | 95% | Gần đủ SRS; cần E2E/UI test. |
| UC33 | Cập nhật question bank | 80% | Có CRUD/import/version; cần audit old/new/action và gate approved. |
| UC34 | Tạo bài kiểm tra | 85% | Có 4 slot/scope/AI/autosave; cần course_version_id và anti-cheat enforcement. |
| UC35 | Chấm điểm bài tập và câu tự luận | 82% | Có grading/audit/retake; cần schema retake/cooldown chuẩn. |
| UC36 | Trả lời câu hỏi học sinh | 90% | Gần đủ SRS; cần test visibility/KPI UI. |
| UC37 | Xem lịch sử doanh thu | 85% | Có period paid/CSV/UNC; cần Excel pháp lý/retention. |
| UC38 | Xem dashboard quản trị | 85% | Có dashboard/KPI; cần reconcile/export. |
| UC39 | Xem danh sách tài khoản người dùng | 80% | Có user list/filter; cần export/audit/teacher state chuẩn. |
| UC40 | Cập nhật tài khoản người dùng | 65% | Có nền admin/profile; thiếu khóa/mở, role, audit/security đầy đủ. |
| UC41 | Duyệt khóa học | 80% | Có approve/reject/revision; cần checklist/audit/diff version. |
| UC42 | Xử lý khiếu nại từ người dùng | 85% | Có xử lý complaint; cần refund/payment dispute/SLA. |
| UC43 | Xuất danh sách chi trả và xác nhận đã chuyển khoản GV | 80% | Có payout confirm/metadata; cần Excel/chứng từ/state machine. |
| UC44 | Gửi thông báo đến người dùng | 80% | Có notification; cần schedule/template/email-push/audit broadcast. |

## 4. Ghi chú khác biệt code hiện tại

- Code đang dùng PayOS trong thanh toán; SRS gốc mô tả VNPay/MoMo/payment gateway. Cần thống nhất trong tài liệu nộp hoặc ghi rõ là adapter/thay thế đã duyệt.
- Code dùng trạng thái PH-HS `ACCEPTED` và map ra API như active; SRS dùng `ACTIVE`.
- SRS 4.14 không yêu cầu giáo viên xem doanh thu realtime ở UC37, nhưng code có thêm tab giao dịch/pending từ `revenue_splits`.
