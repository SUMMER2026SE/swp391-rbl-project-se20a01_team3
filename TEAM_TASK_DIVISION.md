# Kế hoạch chia code theo Use Case — Bee Academy (5 thành viên)

> Cập nhật ngày **01/07/2026** theo trạng thái code hiện tại trong `backend/` và `frontend/`.
> Mỗi thành viên sở hữu một cụm Use Case end-to-end, bao gồm backend, frontend, test, bugfix và tài liệu liên quan.
>
> Cơ sở đối chiếu: **SWT_v4_final.docx (SRS v4.0)** — 44 Use Case, 8 module, 7 actor.
> Code hiện tại đã có nhiều phần vượt bản phân công cũ: PayOS, revenue split, payout, complaint, notification,
> parent portal, parent-teacher message, course approval, question bank, quiz/exam, exam grading và teacher bank.

---

## 1. Tóm tắt cập nhật quan trọng

- **UC34 đã đổi nghiệp vụ:** bài kiểm tra không còn cố định "mỗi 3 chương". Giáo viên cấu hình 4 loại bài:
  **giữa kỳ 1**, **cuối kỳ 1**, **giữa kỳ 2**, **cuối kỳ 2**, đồng thời chọn **đặt bài kiểm tra sau chương nào**.
- `exam_configs` đã có thêm `exam_type` và `anchor_chapter_id`; migration mới: `V015__exam_type_and_anchor_chapter.sql`.
- Parent portal đã có luồng liên kết, dashboard, tiến độ, lịch sử thanh toán và nhắn tin giáo viên.
- Admin đã có dashboard, user management, duyệt khóa học, khiếu nại, payout và thông báo nội bộ.
- Các phần còn thiếu lớn nhất: **chứng chỉ**, **đánh giá khóa học**, **student submit assignment**, **AI chat/lộ trình AI**,
  **admin broadcast notification thật**, và **xuất `.xlsx` backend nếu bắt buộc đúng SRS**.

---

## 2. Trạng thái triển khai thực tế theo module

Ký hiệu: ✅ Đã xong · 🟡 Một phần / cần hoàn thiện · ⬜ Chưa có

| Module | UC | Tên | Backend | Frontend |
|---|---|---|---|---|
| **AUTH** | UC01 | Đăng ký (OTP) | ✅ | ✅ |
| | UC02 | Đăng nhập | ✅ | ✅ |
| | UC03 | Đăng xuất | ✅ | ✅ |
| | UC04 | Đặt lại mật khẩu | ✅ | ✅ |
| | UC05 | Cập nhật hồ sơ | ✅ | ✅ |
| **CRS** | UC06 | Tìm kiếm khóa học | ✅ | ✅ |
| | UC07 | Xem chi tiết khóa học | ✅ | ✅ |
| | UC08 | Xem bài học thử | ✅ (`isFree`, signed URL theo quyền) | ✅ (preview mode trong `CourseDetailPage`) |
| **PAY** | UC09 | Mua khóa học / tạo Order | ✅ | ✅ |
| | UC10 | Thanh toán | ✅ PayOS + webhook/verify | ✅ |
| | UC11 | Lịch sử mua khóa học | ✅ | ✅ |
| | UC12 | Gửi khiếu nại đến Admin | ✅ | ✅ (`ComplaintsPage`, cả HS/GV dùng chung API) |
| **LRN** | UC13 | DS khóa đã mua | ✅ | ✅ |
| | UC14 | Xem bài giảng & tài liệu | ✅ | ✅ |
| | UC15 | Tải tài liệu học tập | 🟡 public document URL; chưa có watermark/signed URL riêng cho tài liệu | ✅ có link tải tài liệu trong phòng học |
| | UC16 | Nộp bài tập | 🟡 có model/submission cho grading; thiếu API tạo/nộp bài từ HS | ⬜ chưa có UI nộp bài tập |
| | UC17 | Làm bài kiểm tra | ✅ quiz chương + exam giai đoạn | ✅ `StudentQuizPage`, `StudentExamPage` |
| | UC18 | Xem điểm & tiến độ | 🟡 có dữ liệu quiz/exam/assignment cho báo cáo; cần trang HS riêng nếu SRS yêu cầu | 🟡 Parent Progress đã có; HS chưa có trang điểm riêng |
| | UC19 | Đánh giá khóa học | ⬜ chưa có model review/rating thật | ⬜ rating đang là dữ liệu hiển thị, chưa có luồng đánh giá |
| | UC20 | Xem & tải chứng chỉ | ⬜ | ⬜ |
| **INT** | UC21 | Gửi câu hỏi cho GV | ✅ Q&A/discussion | ✅ Messages/Q&A |
| | UC22 | Chat AI hỗ trợ | ⬜ | ⬜ |
| | UC23 | Đề xuất lộ trình AI | ⬜ | ⬜ |
| **PRN** | UC24 | Theo dõi tiến độ con | ✅ overview + progress report | ✅ `ParentDashboard`, `ParentProgress`, `ParentCourses` |
| | UC25 | Liên hệ & nhận thông báo GV | ✅ parent-teacher message + email/in-app notify | ✅ `ParentMessages`; GV nhận qua Q&A/notification |
| | UC26 | Lịch sử thanh toán của con | ✅ | ✅ `ParentPayments` |
| | UC27 | Gửi lời mời liên kết con | ✅ email + in-app notify | ✅ `ParentStudentLink` |
| | UC28 | Chấp nhận / từ chối liên kết | ✅ student invitation API | ✅ `NotificationsPage` |
| | UC29 | Hủy liên kết | ✅ request/confirm hai phía + audit log | ✅ |
| **TCH** | UC30 | Tạo khóa học | ✅ | ✅ |
| | UC31 | Cập nhật bài giảng & tài liệu | ✅ upload video/document | ✅ |
| | UC32 | Tạo question bank | ✅ manual/bulk/AI scan import | ✅ |
| | UC33 | Cập nhật question bank | ✅ | ✅ |
| | UC34 | Tạo bài kiểm tra | ✅ 4 loại exam + chọn vị trí sau chương | ✅ `TeacherExamPage` |
| | UC35 | Chấm điểm bài tập | 🟡 có endpoint chấm submission; phụ thuộc UC16 để đủ luồng nộp | ✅ `TeacherGradesPage` đã gọi API thật |
| | UC36 | Trả lời câu hỏi học sinh | ✅ | ✅ `TeacherQAPage` |
| | UC37 | Xem lịch sử doanh thu | ✅ revenue split + payout period | ✅ `TeacherRevenuePage` |
| **ADM** | UC38 | Dashboard quản trị | ✅ | ✅ |
| | UC39 | DS tài khoản người dùng | ✅ list/search/filter/stats | ✅ tab Users |
| | UC40 | Mở/khóa tài khoản, đổi vai trò | ✅ | ✅ |
| | UC41 | Duyệt khóa học | ✅ approve/reject/revise + history + notify GV | ✅ `ApprovalsPage`, `CourseReviewPage` |
| | UC42 | Xử lý khiếu nại | ✅ list/detail/reply/status | ✅ tab Complaints |
| | UC43 | Xác nhận chuyển khoản GV + xuất Excel | 🟡 list/stats/confirm payout có API; export `.xlsx` backend chưa có | ✅ export CSV tương thích Excel + confirm payout |
| | UC44 | Gửi thông báo | 🟡 có hạ tầng in-app notify và admin notify; chưa có API broadcast từ Admin | 🟡 notification UI có thật; form phát thông báo hiện còn local state |

**Tổng quan:** Auth/Payment/Course/Teacher/Parent đã khá đầy đủ; Admin đã vận hành được phần chính.
Các điểm rủi ro còn lại nằm ở nhóm học tập nâng cao, AI, chứng chỉ, review, assignment student flow và NFR.

---

## 3. Bảng phân chia 5 thành viên

| TV | Vai trò | Cụm phụ trách | UC sở hữu | Trọng tâm hiện tại |
|---|---|---|---|---|
| **TV1 — Thành Đạt** | Chủ trì kỹ thuật · Hạ tầng + Tài chính + Thông báo | Auth, Payment, Revenue, Payout, Notification, file dùng chung | UC01-05, UC09-11, UC37, UC43, UC44 | Hardening PayOS/payout, chuẩn hóa notification, migration, merge, CI/test |
| **TV2** | Học tập cốt lõi & Chứng chỉ | Course browsing, learning room, tài liệu, review, certificate | UC06-08, UC13-15, UC19, UC20 | Hoàn thiện signed/watermark tài liệu, review/rating, certificate PDF/QR |
| **TV3** | Khảo thí, Bài tập & Tương tác học | Quiz, exam, assignment, grading, progress, Q&A, AI stretch | UC16-18, UC21-23, UC35, UC36 | Hoàn tất student assignment flow, progress HS, test exam mới |
| **TV4** | Giáo viên & Phụ huynh | Teacher authoring, parent portal, parent-teacher communication | UC24-29, UC30-34 | Bảo trì parent portal, authoring, exam placement, edge case liên kết PH-HS |
| **TV5** | Quản trị & Khiếu nại | Admin user, approvals, complaints, phối hợp payout/notification | UC12, UC38-42 | Hoàn thiện admin UX, complaint SLA, user/admin test, phối hợp UC43/44 với TV1 |

UC22 và UC23 vẫn là **stretch goal** vì code hiện tại mới có AI scan PDF cho ngân hàng câu hỏi, chưa có chat AI/lộ trình AI cho học sinh.

---

## 4. Chi tiết từng thành viên

### TV1 — Thành Đạt · Hạ tầng + Tài chính + Thông báo

**UC sở hữu:** UC01-05, UC09-11, UC37, UC43, UC44.

**Backend chính:**
- `AuthController`, `AuthService`, `OtpService`, `ProfileController`
- `OrderController`, `OrderService`, `PayOSWebhookController`
- `TeacherRevenueController`, `TeacherRevenueService`
- `AdminPayoutController`, `AdminPayoutService`
- `UserNotificationController`, `AdminNotificationController`, `UserNotificationService`, `AdminNotificationService`
- Spring Security, JWT, CORS, exception handling, `application.yml`, migration SQL

**Frontend chính:**
- `Login`, `Register`, `ForgotPassword`, `OAuthCallbackPage`
- `CheckoutPage`, `PaymentResultPage`, `OrdersPage`
- `TeacherRevenuePage`
- Admin payout tab trong `DashboardAdmin`
- `NotificationsPage`, notification dropdown/header

**Việc còn lại:**
- Bổ sung test cho PayOS webhook/verify, revenue split, payout confirm.
- Nếu SRS yêu cầu file Excel thật: thêm endpoint export `.xlsx` bằng Apache POI; hiện UI export CSV tương thích Excel.
- Chuẩn hóa UC44: thêm API Admin broadcast notification theo role/nhóm người dùng, có thể kèm email.
- Gác cổng migration: hiện đã có tới `V015__exam_type_and_anchor_chapter.sql`.

### TV2 · Học tập cốt lõi & Chứng chỉ

**UC sở hữu:** UC06-08, UC13-15, UC19, UC20.

**Backend chính:**
- `CourseController`, `CourseService`
- `EnrollmentController`, `EnrollmentService`
- `CourseDocument`, `CourseDocumentRepository`
- Signed video URL qua Supabase Storage

**Frontend chính:**
- `CoursesPage`, `CourseDetailPage`, learning room trong `CourseDetailPage`
- `courseService.ts`, `enrollmentService.ts`, `adapter.ts`

**Việc còn lại:**
- UC15: chuyển tài liệu từ public URL sang signed URL nếu cần, thêm watermark/log tải xuống theo NFR.
- UC19: thêm `Review`/`CourseReview` model, API đánh giá sao/nhận xét, chỉ cho học sinh đã mua đánh giá.
- UC20: sinh chứng chỉ PDF + QR verify public, trang xem/tải chứng chỉ.
- Rà lại rating đang hiển thị để tránh nhầm với đánh giá thật.

### TV3 · Khảo thí, Bài tập & Tương tác học

**UC sở hữu:** UC16-18, UC21-23, UC35, UC36.

**Backend chính:**
- `QuizController`, `QuizService`, `QuizConfig`, `QuizAttempt`
- `ExamController`, `StudentExamController`, `TeacherExamGradingController`, `ExamService`, `ExamConfig`, `ExamAttempt`, `ExamType`
- `AssignmentController`, `AssignmentService`, `Assignment`, `AssignmentSubmission`
- `QaController`, `QaService`, `CourseDiscussionController`, `CourseDiscussionService`

**Frontend chính:**
- `StudentQuizPage`, `StudentExamPage`
- `TeacherExamPage`, `TeacherGradesPage`, `TeacherQAPage`
- `MessagesPage`, Q&A tab trong learning room
- `quizService.ts`, `examService.ts`, `assignmentService.ts`, `qaService.ts`, `courseDiscussionService.ts`

**Việc còn lại:**
- UC16: thêm API/UI để giáo viên tạo assignment và học sinh nộp bài/file.
- UC18: nếu cần đúng SRS cho học sinh, thêm trang điểm/tiến độ riêng thay vì chỉ nằm trong parent report/course detail.
- UC35: hoàn thiện end-to-end sau khi UC16 có submission thật.
- Test kỹ UC34/UC17 mới: exam type, anchor chapter, thứ tự 4 mốc, điều kiện unlock theo các chương trước vị trí exam.
- UC22/UC23: chỉ làm khi còn thời gian; AI scan PDF hiện không thay thế Chat AI/lộ trình AI.

### TV4 · Giáo viên authoring & Phụ huynh

**UC sở hữu:** UC24-29, UC30-34.

**Backend chính:**
- `TeacherCourseController`, `TeacherCourseService`
- `UploadController`, `ContentUploadService`
- `QuestionController`, `QuestionService`, `AiScanController`, `AiScanService`
- `ParentController`, `ParentService`
- `StudentParentLinkController`, `StudentParentLinkService`
- `ParentStudentLink`, `ParentLinkAuditLog`

**Frontend chính:**
- `TeacherCoursesPage`, `TeacherContentPage`, `QuestionBankPage`, `TeacherQuizChapterPage`, `TeacherExamPage`
- `ParentDashboard`, `ParentCourses`, `ParentProgress`, `ParentPayments`, `ParentMessages`, `ParentStudentLink`
- `teacherCourseService.ts`, `questionService.ts`, `parentService.ts`, `studentParentLinkService.ts`

**Việc còn lại:**
- Rà UI/validation cho authoring, đặc biệt submit course/revision và upload tài liệu/video.
- Rà parent link edge cases: gửi lại lời mời, hủy lời mời, học sinh/phụ huynh cùng yêu cầu unlink.
- Phối hợp TV3 để parent progress đọc đúng quiz/exam/assignment sau khi UC16 hoàn chỉnh.
- Rà lại `TeacherExamPage` sau thay đổi UC34: vị trí sau chương, required chapters, lỗi trùng/thứ tự mốc.

### TV5 · Admin & Khiếu nại

**UC sở hữu:** UC12, UC38-42.

**Backend chính:**
- `AdminDashboardController`, `AdminDashboardService`
- `AdminUserController`
- `AdminApprovalController`, `ApprovalService`, `ApprovalHistory`, `CourseVersion`
- `ComplaintController`, `AdminComplaintController`, `ComplaintService`, `Complaint`, `ComplaintMessage`

**Frontend chính:**
- `DashboardAdmin`, `ApprovalsPage`, `CourseReviewPage`
- `ComplaintsPage` phía student/teacher
- `adminService.ts`, `complaintService.ts`

**Việc còn lại:**
- Viết test cho user list/search/filter, block/unblock, change role.
- Viết test cho duyệt khóa học: approve/reject/revise, history, notification cho teacher.
- Hoàn thiện complaint UX: filter/search/pagination, SLA, đóng/mở thread nếu SRS yêu cầu.
- Phối hợp TV1 ở UC43/UC44 vì payout/notification là tính năng Admin nhưng đụng hạ tầng/tài chính chung.

---

## 5. Sở hữu schema dùng chung & migration

| Entity / bảng | Chủ sở hữu | Người dùng chung |
|---|---|---|
| `profiles`, auth/session, role/block | TV1 | TV4, TV5 |
| `courses`, `chapters`, `lessons`, `course_documents`, `course_versions` | TV2/TV4 | TV5 duyệt, TV3 đọc để exam/quiz |
| `orders`, `order_items`, `revenue_splits`, `payout_periods` | TV1 | TV5 Admin payout, TV4 Parent payments |
| `quiz_configs`, `quiz_attempts`, `exam_configs`, `exam_attempts`, `assignments`, `assignment_submissions` | TV3 | TV2 certificate/progress, TV4 parent report |
| `parent_student_links`, `parent_link_audit_log` | TV4 | TV3/TV5 đọc trạng thái liên quan |
| `qa_threads`, `qa_messages`, `course_discussion_*` | TV3/TV4 | Parent/Teacher/Student UI |
| `complaints`, `complaint_messages` | TV5 | Student/Teacher/Parent tạo qua API chung |
| `user_notifications`, `admin_notifications` | TV1 | Tất cả module chỉ gọi service/API chung |

**Quy tắc migration:** không sửa migration cũ đã chạy nếu không cần thiết. Thay đổi DB mới thêm file `Vxxx__...sql`,
TV1 kiểm tra thứ tự và conflict. Với UC34 hiện đã thêm `V015__exam_type_and_anchor_chapter.sql`.

---

## 6. Phụ thuộc chéo cần checkpoint

| Tính năng | Phụ thuộc | Checkpoint |
|---|---|---|
| UC16/UC35 Assignment | TV3 + TV4 content authoring | Thống nhất assignment gắn course/chapter/lesson và luồng HS nộp |
| UC18 Progress HS | quiz/exam/assignment + enrollment | TV3 cung cấp dữ liệu; TV2/TV4 hiển thị đúng vai trò |
| UC20 Certificate | completion/progress + pass exam | TV2 cần API điều kiện đạt từ TV3 |
| UC24/UC26 Parent | progress + order/payment | TV4 đọc qua API/service, không query thẳng bảng module khác |
| UC34 Exam placement | chapter order + exam config | TV3/TV4 test thứ tự 4 mốc và migration `anchor_chapter_id` |
| UC43 Payout | revenue split + teacher bank | TV1 chủ trì; TV5 test luồng Admin |
| UC44 Notification | mọi module phát thông báo | TV1 chuẩn hóa service/API, module khác không tự dựng cơ chế riêng |

---

## 7. Quy tắc làm việc chung

1. **Branch theo UC hoặc cụm nhỏ:** `feature/uc16-assignment-submit`, `feature/uc20-certificate`, `fix/uc34-exam-placement`.
2. **File dùng chung báo TV1 trước khi sửa:** `App.tsx`, `api/client.ts`, `ProtectedRoute.tsx`, Spring Security, enum/DTO chung,
   `application.yml`, migration SQL.
3. **Ưu tiên thêm file theo module** thay vì sửa lan sang module người khác.
4. **UI text tiếng Việt**, giữ phong cách Material Design 3 token đang dùng trong frontend.
5. **Test tối thiểu mỗi UC:** 1 happy path + 1 negative path; phần tiền/role/payout/approval phải có test quyền truy cập.
6. **Không trộn refactor lớn vào PR tính năng.** Với schema chung, mô tả rõ entity nào bị ảnh hưởng.

---

## 8. Phân bổ công việc theo trạng thái

| TV | UC đã xong / bảo trì + test | UC cần hoàn thiện | Ghi chú |
|---|---|---|---|
| **TV1** | UC01-05, UC09-11, UC37 | UC43 export `.xlsx` nếu cần, UC44 broadcast/email, hạ tầng test | Cao nhất vì giữ file chung + merge |
| **TV2** | UC06-08, UC13-15 mức cơ bản | UC15 bảo mật tài liệu, UC19, UC20 | Tập trung learning/certificate |
| **TV3** | UC17, UC21, UC36, UC35 phía teacher | UC16, UC18, test UC34/Exam, UC22/23 stretch | Phụ trách logic đánh giá học tập |
| **TV4** | UC24-29, UC30-34 | Rà edge case parent/teacher authoring, phối hợp UC34 | Parent portal gần đủ luồng |
| **TV5** | UC12, UC38-42 | Test Admin/Complaint, phối hợp UC43/44 với TV1 | Admin UX và nghiệp vụ xử lý |

---

## 9. Lưu ý khi báo cáo giảng viên

- SRS ghi VNPay/MoMo nhưng code dùng **PayOS**; cần ghi rõ đây là quyết định thay thế.
- Không ghi UC34 là "mỗi 3 chương" nữa; hiện là **4 mốc kiểm tra do giáo viên đặt sau chương**.
- UC43 hiện export CSV tương thích Excel ở frontend; nếu giảng viên bắt buộc `.xlsx`, cần thêm backend export.
- UC44 có notification thật cho các sự kiện hệ thống, nhưng **form phát thông báo toàn hệ thống** chưa có API lưu/gửi thật.
- UC19/UC20/UC22/UC23 chưa hoàn thiện, không nên trình bày là đã xong.
