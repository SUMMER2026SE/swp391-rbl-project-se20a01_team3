# Báo cáo review code theo SRS Bee Academy 4.14

Ngày review: 15/07/2026

Nguồn đối chiếu:

- SRS: `C:\Users\ledai\Downloads\SRS_4.14_final.docx`, phiên bản 4.14.
- Code hiện tại: workspace `D:\swp391-rbl-project-se20a01_team3`.
- Phạm vi quét: `backend/src/main/java`, `backend/db/migrations`, `frontend/src`, route/API/page frontend và test hiện có.

## 1. Kết luận nhanh

Hệ thống đã có triển khai thực tế cho hầu hết 8 module trong SRS, không chỉ riêng Phụ huynh và Giáo viên. Backend test hiện tại chạy xanh:

| Lệnh | Kết quả |
| --- | --- |
| `mvn test` trong `backend` | Thành công: 55 tests, 0 failures, 0 errors |

Tổng hợp theo module:

| Module | Phạm vi UC | Mức hoàn thành ước lượng | Nhận xét ngắn |
| --- | --- | ---: | --- |
| Xác thực & Tài khoản | UC01-UC05 | ~76% | Có auth/profile/OTP/reset; còn thiếu khóa đăng nhập 5 lần, trạng thái tài khoản/teacher approval đầy đủ theo SRS. |
| Tìm kiếm & Khóa học | UC06-UC08 | ~87% | Search/detail/free preview đã có; cần củng cố test quyền xem nội dung miễn phí. |
| Mua hàng & Thanh toán | UC09-UC12 | ~78% | Có PayOS/order/webhook/history/complaint; lệch gateway VNPay/MoMo và thiếu PaymentAttempt/refund/reconciliation đầy đủ. |
| Học tập | UC13-UC20 | ~85% | Có enrollment, học bài, tài liệu, assignment, exam, progress, review, certificate; thiếu vài rule nâng cao và test E2E. |
| Tương tác & Hỗ trợ | UC21-UC23 | ~75% | Q&A tốt; AI chat/roadmap có nền tảng nhưng thiếu consent/opt-out/delete history đầy đủ. |
| Phụ huynh | UC24-UC29 | ~84% | Parent portal mạnh, có link/consent/audit/report; UC29 còn lệch nghiệp vụ hủy liên kết. |
| Giáo viên | UC30-UC37 | ~83% | Teacher portal mạnh; còn thiếu approved-teacher gate phủ toàn bộ, audit/version/export chuẩn. |
| Admin | UC38-UC44 | ~79% | Dashboard/user/course/complaint/payout/notification đã có; còn thiếu security rule, audit nâng cao, reconcile/refund. |

## 2. Bảng đánh giá toàn bộ Use Case

| Tên UC | % hoàn thành | Phần đã hoàn thành | Phần chưa hoàn thành | Phần đã cải tiến thêm so với SRS |
| --- | ---: | --- | --- | --- |
| UC01 - Đăng ký tài khoản | 75% | Có flow đăng ký tài khoản, tạo profile/role, OTP/email theo tầng auth, frontend form và xử lý lỗi cơ bản. | Trạng thái tài khoản và hồ sơ giáo viên chưa khớp hoàn toàn SRS; chưa thấy đầy đủ rule chống spam/duplicate nâng cao và audit đăng ký. | Tích hợp Supabase/Auth provider, tự tạo profile theo role, có nhánh role phụ huynh/giáo viên/học sinh. |
| UC02 - Đăng nhập hệ thống | 75% | Có login JWT/session, phân quyền route theo role, redirect theo vai trò, kiểm tra token và profile. | Chưa chứng minh đủ lock sau 5 lần sai/15 phút, trạng thái BLOCKED/SUSPENDED theo SRS chưa phủ hết, audit login chưa đầy đủ. | Có helper điều hướng tránh đưa GV/Admin/PH nhầm về trang course chung. |
| UC03 - Đăng xuất hệ thống | 70% | Frontend có logout, clear store/token và đưa người dùng ra khỏi session hiện tại. | Access token TTL/revocation server-side chưa rõ; chưa thấy audit logout và revoke toàn bộ refresh token ở mọi thiết bị. | Đồng bộ state auth ở frontend để tránh giữ role/profile cũ sau logout. |
| UC04 - Đặt lại mật khẩu | 80% | Có forgot/reset password, OTP/email, cập nhật mật khẩu qua Auth provider admin API. | Chưa thấy chính sách vô hiệu hóa toàn bộ session cũ sau reset và rate limit/audit đầy đủ theo SRS. | Dùng admin API để đổi mật khẩu có kiểm soát thay vì chỉ client-side reset. |
| UC05 - Cập nhật hồ sơ cá nhân | 80% | Có cập nhật profile/avatar/thông tin cá nhân, trang tài khoản giáo viên, ngân hàng giáo viên có audit và trạng thái xác minh. | Dữ liệu nhạy cảm như bank/card chưa có mã hóa/audit/security rule đầy đủ theo SRS; teacher profile state cần chuẩn hóa hơn. | Có module tài khoản ngân hàng giáo viên, audit thay đổi và reset trạng thái chờ admin xác minh. |
| UC06 - Tìm kiếm khóa học | 90% | Có danh sách khóa học, tìm kiếm/lọc theo từ khóa, danh mục, cấp lớp, giá/trạng thái, API và UI public. | Cần thêm test hiệu năng/phân trang và xác nhận rule chỉ hiển thị khóa đã approved/published trong mọi ngữ cảnh. | Có dữ liệu summary, đánh giá/giá/thumbnail hỗ trợ trải nghiệm tìm khóa tốt hơn. |
| UC07 - Xem chi tiết khóa học | 90% | Có trang chi tiết khóa, thông tin chương/bài, giáo viên, giá, đánh giá, trạng thái đã mua/được truy cập. | Cần kiểm thử đầy đủ quyền xem nội dung private với guest/user chưa mua. | Có hiển thị enrollment/access state, review summary và preview nội dung. |
| UC08 - Xem bài học thử | 80% | Có cơ chế `isFree`/free preview và frontend cho xem bài miễn phí. | Cần test chặn tài liệu/video không free, signed URL và route deep-link cho guest chưa mua. | Tích hợp preview vào course detail thay vì tách flow riêng. |
| UC09 - Mua khóa học | 75% | Có tạo order, checkout, áp dụng voucher/reward, xử lý role học sinh/phụ huynh ở một số luồng, tạo enrollment sau thanh toán. | Phụ huynh mua cho con ACTIVE cần E2E rõ hơn; chưa có đầy đủ rule số lượng, duplicate purchase, cancel/expire theo SRS. | Có reward/voucher ngoài SRS, tăng khả năng khuyến mãi và giữ chân người học. |
| UC10 - Thanh toán khóa học | 70% | Có tích hợp PayOS, tạo link thanh toán, webhook, kiểm tra chữ ký, verify/reconcile đơn pending ở mức dịch vụ, ghi revenue split. | SRS nêu payment gateway kiểu VNPay/MoMo; code dùng PayOS nên cần ghi rõ thay thế. Thiếu bảng/flow PaymentAttempt, refund_status, reconciliation_status và hoàn tiền đầy đủ. | Có DEV_MODE cảnh báo khi bypass signature, có revenue split phục vụ payout giáo viên. |
| UC11 - Xem lịch sử mua khóa học | 80% | Có lịch sử order/payment, trạng thái, thông tin khóa, frontend payment result/history; phụ huynh có lịch sử theo con. | Hóa đơn điện tử/PDF pháp lý và bộ lọc nâng cao chưa hoàn chỉnh; refund linkage chưa đầy đủ. | Có phân biệt payer role, pending count, tổng tiền và thông tin invoice in ra frontend. |
| UC12 - Gửi khiếu nại đến Admin | 85% | Có ComplaintController, ComplaintService, trang khiếu nại, admin xử lý trạng thái/trả lời. | Chưa gắn hoàn chỉnh với refund/payment review và SLA xử lý; attachment/moderation/audit nâng cao cần kiểm thử. | Có dashboard/admin inbox cho khiếu nại, tốt hơn mức form gửi đơn giản. |
| UC13 - Xem danh sách khóa học đã mua | 90% | Có my courses/enrollment, course access, progress summary và frontend danh sách khóa học của học sinh. | Cần test đầy đủ case refund/revoke enrollment và course version sau khi khóa cập nhật. | Có store hydrate progress/offline sync hỗ trợ trải nghiệm học liên tục. |
| UC14 - Xem bài giảng & tài liệu | 85% | Có lesson/chapter, video/document, cập nhật progress học, lưu tiến độ video và trạng thái hoàn thành bài. | Unique watched segments, rule chống tua/đếm progress nâng cao và HLS processing chưa chứng minh đủ. | Có offline learning sync queue cho video progress/completion. |
| UC15 - Tải tài liệu học tập | 85% | Có tài liệu lesson, signed URL/download, log download qua `StudentDocumentDownload`, kiểm soát quyền theo enrollment. | Watermark/chống chia sẻ và expiry policy cần xác nhận qua test; chưa có báo cáo tải xuống đầy đủ. | Có log tải tài liệu theo student/document/IP/user-agent. |
| UC16 - Nộp bài tập | 80% | Có AssignmentService, submit bài, lưu file/answer, giáo viên chấm và trả điểm. | Late policy, giới hạn số lần nộp, resubmit window và thông báo deadline chưa phủ đủ theo SRS. | Gắn chung với grade audit và notification khi giáo viên chấm. |
| UC17 - Làm bài kiểm tra | 85% | Có exam attempt, autosave, submit, objective/essay scoring, unlock theo progress, retake request, cấu hình anti-cheat. | Anti-cheat frontend enforcement và ExamEnrollment/RetakeApproval đúng schema SRS chưa đầy đủ; cần E2E cho 4 bài cố định. | Có mixed question type, autosave draft và tích hợp certificate/reward sau khi có điểm. |
| UC18 - Xem điểm & tiến độ học tập | 85% | Có progress course, điểm quiz/exam/assignment, summary cho học sinh và phụ huynh. | SLA realtime/cập nhật <= 5 phút và rule điểm chuẩn hóa theo course version cần test thêm. | Có dữ liệu phục vụ parent weekly report và AI roadmap. |
| UC19 - Đánh giá khóa học | 85% | Có course review, summary rating, my review và danh sách review trên frontend. | Moderation/spam rule, điều kiện chỉ review khi sở hữu/học đủ và edit/delete audit cần kiểm thử. | Có review summary tích hợp ngay ở course detail. |
| UC20 - Xem & tải chứng chỉ | 88% | Có CertificateService, CertificateController, PDF certificate, QR/verify, signed view/download URL, lifecycle issued/reissued/revoked/needs review. | Điều kiện cấp chứng chỉ theo đúng 4 bài kiểm tra và course_version cần E2E; template pháp lý/branding cần kiểm tra render. | Có verify public bằng QR và tự đưa chứng chỉ về NEEDS_REVIEW khi điểm cuối kỳ thay đổi. |
| UC21 - Gửi câu hỏi cho giáo viên | 85% | Có Q&A thread, message, attachment, trạng thái pending/answered/resolved, notification cho giáo viên. | Visibility public/private và moderation/retention cần test đầy đủ. | Hỗ trợ cả luồng phụ huynh nhắn giáo viên qua cùng nền Q&A. |
| UC22 - Chat AI hỗ trợ | 70% | Có AiChatService, AiStudentController, frontend AI Tutor và tích hợp Gemini/AI provider. | Consent/opt-out/delete history, fallback khi AI lỗi, rate limit và logging chính sách dữ liệu chưa đủ theo SRS. | Có AI tutor thực tế thay vì placeholder, có thể dùng dữ liệu học để trả lời cá nhân hóa. |
| UC23 - Nhận đề xuất lộ trình từ AI | 70% | Có service/endpoint tạo roadmap và frontend liên quan đến AI gợi ý học tập. | Chưa đủ rule không gửi dữ liệu khi rút consent, giải thích lý do đề xuất, lưu/xóa lịch sử và audit AI. | Tận dụng progress/điểm để cá nhân hóa lộ trình, vượt mức gợi ý tĩnh. |
| UC24 - Theo dõi tiến độ học tập của con | 85% | Có dashboard/report tiến độ, khóa học, bài đã học, exam/assignment, quyền xem theo link, privacy/consent, audit khi phụ huynh xem dữ liệu, weekly summary. | Chưa chứng minh SLA cập nhật <= 5 phút; báo cáo 4 bài cố định còn phụ thuộc dữ liệu exam thực tế; export báo cáo tuần chuẩn file chưa rõ. | Có masking lý do chi tiết, biểu đồ/print report frontend, weekly summary rule-based. |
| UC25 - Liên hệ & nhận thông báo từ giáo viên | 85% | Có phụ huynh nhắn giáo viên theo khóa học của con, lưu hội thoại qua Q&A, gửi notification/email cho giáo viên và phụ huynh khi giáo viên trả lời. | Chưa thấy giới hạn 2000 ký tự enforce rõ; moderation và retention 12 tháng chưa có policy/job đầy đủ. | Có đính kèm file/tài liệu, hợp nhất luồng PH-GV vào Q&A để giáo viên xử lý cùng nơi. |
| UC26 - Xem lịch sử thanh toán khóa học | 80% | Có API/payment history theo con ACTIVE, gồm giao dịch PH hoặc HS, trạng thái, khóa học, tiến độ hiện tại, lọc theo khóa/thời gian. | Hóa đơn điện tử pháp lý chưa hoàn chỉnh; chủ yếu là invoice info/print phía frontend. | Có thống kê tổng tiền, pending count, tiến độ trung bình, phân biệt payer role PH/HS. |
| UC27 - Gửi lời mời liên kết con | 95% | Có nhập email HS, relationship/note, response trung lập chống dò email, giới hạn 5 con, rate limit, PENDING hết hạn 7 ngày, email/notification, hủy lời mời pending. | Chưa thấy system test E2E đầy đủ cho toàn flow email/in-app. | Có audit cả attempt thất bại/rate-limited và neutral response tốt hơn SRS. |
| UC28 - Chấp nhận / từ chối liên kết | 90% | HS xem lời mời, accept/reject, tự expire sau 7 ngày, audit log, thông báo PH, cho phép nhiều PH liên kết 1 HS. | DB/API dùng `ACCEPTED` nội bộ rồi map active; cần thống nhất thuật ngữ với SRS dùng `ACTIVE`. | Có flow consent dữ liệu nhạy cảm theo từng phụ huynh. |
| UC29 - Hủy liên kết tài khoản | 70% | Cả PH và HS có request/confirm unlink, chuyển `REVOKED`, audit, notification hai bên. | Lệch SRS: SRS yêu cầu một bên chủ động hủy ACTIVE sau xác nhận; code đang thiên về hai bên xác nhận nên UC24/25/26 có thể chưa khóa ngay sau một bên yêu cầu. Thiếu lý do hủy tùy chọn. | Cơ chế xác nhận hai phía giúp giảm hủy nhầm, nhưng cần xác nhận lại với stakeholder. |
| UC30 - Tạo khóa học mới | 80% | Có tạo draft, cập nhật thông tin, chương/bài học, lưu/gửi duyệt, kiểm tra tối thiểu 4 chương, mỗi chương có bài, đủ 4 bài kiểm tra và coverage liên tục, tạo course version snapshot, thông báo Admin. | Gate giáo viên đã được duyệt chưa phủ toàn bộ TeacherCourseService; enrollment version/migration chưa hoàn chỉnh toàn hệ thống. | Có validation giá/sale price, thumbnail/video intro, snapshot JSON chi tiết khi submit. |
| UC31 - Cập nhật bài giảng & tài liệu | 70% | Có quản lý chapter/lesson, upload video/tài liệu, document per lesson, reorder, xóa/cập nhật nội dung, course version khi submit lại. | Chưa có HLS encode thật <= 30 phút, lưu video gốc 12 tháng, audit mọi thay đổi lớn/nhỏ, migration version cho HS/PH đầy đủ; completion_rule chưa đủ theo SRS. | Có storage upload, video fallback/slide cue, tài liệu gắn lesson khá chi tiết. |
| UC32 - Tạo question bank | 95% | Có entity question bank riêng, tạo bank ACTIVE với 0 câu hỏi, title unique theo GV, category/grade, chặn GV chưa approved qua TeacherAccessService, có test. | Chủ yếu cần E2E/UI test đầy đủ. | Có trạng thái active/inactive, grade/category rõ hơn yêu cầu tối thiểu. |
| UC33 - Cập nhật question bank | 80% | Có thêm/sửa/xóa câu hỏi, bulk import, nhiều loại câu hỏi, cảnh báo trùng, archive câu hỏi đã dùng, snapshot `question_versions`. | Gate approved teacher chưa phủ trực tiếp trong QuestionService; audit log old/new/action chưa đủ schema SRS. | Có import Excel, nhiều question type mở rộng, duplicate warning và versioning khi câu hỏi đã dùng. |
| UC34 - Tạo bài kiểm tra | 85% | Có 4 slot bài kiểm tra, chọn phạm vi chapter start/end, kiểm tra continuity/coverage, random từ question bank, objective/essay, AI draft + GV approve, anti-cheat config, unlock theo progress, autosave. | Chưa thấy `course_version_id` trong ExamConfig; chống gian lận mới ở mức cấu hình, chưa chứng minh enforcement UI đầy đủ; retake/exam enrollment chưa đúng toàn bộ SRS. | Có AI sinh câu hỏi, audit prompt/action/source_refs, upload ảnh/file đáp án. |
| UC35 - Chấm điểm bài tập và câu tự luận | 82% | Có chấm assignment và exam essay, validate điểm, sửa điểm trong 24h bắt buộc lý do, grade audit old/new/grader/reason, notification HS, cập nhật reward/certificate, retake approve/reject. | Retake schema chưa đúng hoàn toàn SRS; cooldown/audit schema chưa đầy đủ; logic số lần duyệt cần thống nhất với SRS. | Gộp chấm assignment + exam essay, có grade audit và trigger certificate review/recalc. |
| UC36 - Trả lời câu hỏi học sinh | 90% | Có list Q&A theo GV, trả lời, edit câu trả lời, update status, notify HS, notify PH nếu thread có PH, đính kèm ảnh, mark duplicate, KPI 48h/7 ngày. | Visibility public/private cần test enforce đầy đủ; báo cáo KPI cần UI/test xác nhận. | Có duplicate linking và KPI report vượt yêu cầu luồng chính. |
| UC37 - Xem lịch sử doanh thu | 85% | Có xem kỳ chi trả đã PAID/confirmed, chi tiết giao dịch nguồn, transfer ref/content, UNC attachment URL, export CSV, chỉ cho GV xem period của mình. | SRS yêu cầu Excel/chứng từ pháp lý; hiện là CSV. Retention >= 5 năm chưa có policy rõ; thuật ngữ `PAID`/`CONFIRMED` cần thống nhất. | Có realtime revenue split/pending view ngoài phạm vi SRS và export có BOM UTF-8/UNC metadata. |
| UC38 - Xem dashboard quản trị | 85% | Có admin dashboard, KPI vận hành, số liệu user/course/order/complaint/payout và cảnh báo cơ bản. | Realtime reconcile, số tiền đang giữ/phải chuyển theo kỳ và export báo cáo tổng cần kiểm thử đầy đủ. | Có nhiều chỉ số vận hành hơn dashboard tối thiểu. |
| UC39 - Xem danh sách tài khoản người dùng | 80% | Có quản lý user/profile, tìm kiếm/lọc cơ bản, xem role/trạng thái và thông tin giáo viên. | Pagination/export Excel, teacher_profile_state chuẩn SRS và audit truy cập danh sách chưa đầy đủ. | Có liên kết sang quy trình xác minh ngân hàng/giáo viên. |
| UC40 - Cập nhật tài khoản người dùng | 65% | Có một số thao tác admin với user, teacher approval status, cập nhật/reset mật khẩu qua admin API. | Khóa/mở khóa, đổi role, reset password, duyệt/từ chối/thu hồi GV, rule bảo mật 2 lớp và audit đầy đủ chưa hoàn chỉnh. | Có sẵn teacher approval model và bank verification để mở rộng nhanh. |
| UC41 - Duyệt khóa học | 80% | Có submit review từ GV, admin approve/reject/needs revision, thông báo, version snapshot và validation 4 bài kiểm tra trước khi duyệt. | Checklist review chi tiết, audit từng quyết định và diff version cần hoàn thiện; gate từ chối khi GV chưa approved cần phủ chắc hơn. | Tự kiểm tra 4 chương/4 bài kiểm tra/coverage trước khi admin nhận duyệt. |
| UC42 - Xử lý khiếu nại từ người dùng | 85% | Có admin complaint controller/service, danh sách khiếu nại, cập nhật trạng thái, phản hồi người dùng. | Chưa tích hợp hoàn chỉnh với refund/payment dispute, SLA và attachment evidence đầy đủ. | Có complaint dashboard và liên kết UC12 tốt hơn mức xử lý thủ công. |
| UC43 - Xuất danh sách chi trả và xác nhận đã chuyển khoản GV | 80% | Có payout period, revenue split, admin xác nhận đã chuyển khoản, transfer ref/content, UNC URL, thông báo GV, giáo viên xem lịch sử đã paid. | Export Excel/chứng từ pháp lý và upload file UNC đầy đủ cần hoàn thiện; state machine payout/retry/audit chi tiết chưa đủ. | Có backfill revenue split và metadata chuyển khoản phục vụ đối soát. |
| UC44 - Gửi thông báo đến người dùng | 80% | Có notification service, bell frontend, mark read, admin/system gửi thông báo cho người dùng/nhóm. | Lên lịch gửi, kênh email/push đầy đủ, template và audit broadcast chưa hoàn chỉnh. | Notification được dùng xuyên module: course review, parent link, Q&A, payout, grading. |

## 3. Bằng chứng code chính

- Auth/Profile: `AuthProviderClient`, `SupabaseAuthClient`, `Profile`, `TeacherApprovalStatus`, frontend auth store/routes.
- Course/Search/Learning: `CourseController`, `CourseProgressService`, `StudentVideoProgress`, `StudentDocumentDownload`, các trang course/learning frontend.
- Payment/Complaint: `OrderService`, `PayOSWebhookController`, `OrderController`, `ComplaintController`, `AdminComplaintController`, frontend checkout/payment/complaints.
- Certificate/Review: `CertificateService`, `CertificateController`, course review API/frontend.
- Interaction/AI: `QaService`, `AiChatService`, `AiStudentController`, `AiScanService`.
- Parent: `ParentController`, `ParentService`, `StudentParentLinkController`, `StudentParentLinkService`, `ParentStudentLink`, `ParentLinkAuditLog`, `ParentProgressAccessAudit`.
- Teacher: `TeacherCourseService`, `QuestionBankService`, `QuestionService`, `ExamService`, `AssignmentService`, `TeacherRevenueService`, `ExamRetakeService`.
- Admin/Payout/Notification: `AdminPayoutService`, `PayoutPeriod`, `RevenueSplit`, `UserNotification`, admin dashboard/user/course/complaint APIs.

## 4. Rủi ro ưu tiên xử lý

1. Chuẩn hóa các điểm lệch SRS lớn: PayOS thay VNPay/MoMo, `ACCEPTED` thay `ACTIVE`, UC29 hủy một phía hay xác nhận hai phía.
2. Phủ `TeacherAccessService.requireApprovedTeacher()` cho toàn bộ API giáo viên, không chỉ question bank.
3. Hoàn thiện payment state machine: `PaymentAttempt`, refund, reconciliation, invoice pháp lý.
4. Bổ sung consent/opt-out/delete history cho AI chat và AI roadmap.
5. Hoàn thiện audit/versioning/export cho course content, question update, retake, payout, admin user action.
6. Viết thêm E2E/system test cho 44 UC, ưu tiên payment, certificate, parent link, 4 bài kiểm tra cố định và admin payout.
