# TV4 — Đại Thành · Giáo viên (authoring) & Phụ huynh

**UC phụ trách:** UC30-34 (Tạo khóa/Nội dung/Question bank/Exam) · UC24 (Theo dõi tiến độ con) ·
UC25 (Liên hệ GV) · UC26 (Lịch sử thanh toán con) · UC27 (Gửi lời mời) · UC28 (Chấp nhận/từ chối) · UC29 (Hủy liên kết).

## File đang phụ trách (đã có trong thư mục)
- **Backend:** TeacherCourse/Upload/Question/Parent (controller+service), model/repo ParentStudentLink, Question, QuestionChoice.
- **Frontend:** Teacher CoursesPage/ContentPage/QuestionBankPage/QuizChapterPage/ExamPage/DashboardTeacher,
  các trang Parent*, `teacherCourseService/questionService/parentService`.

## File cần TẠO MỚI
- Luồng liên kết PH–HS: endpoint **gửi lời mời / chấp nhận / từ chối** (UC27, UC28) — mở rộng ParentService + ParentStudentLink (thêm trạng thái PENDING/ACTIVE/REVOKED)
- Kênh **PH liên hệ GV** (UC25) · truy vấn **lịch sử thanh toán của con** (UC26 — đọc Order qua API của TV1)
- `frontend/.../pages/parents/ParentLinkInvite.tsx`, `ParentPayments.tsx` (hoặc bổ sung vào trang có sẵn)

## Việc còn phải code
- Teacher authoring (UC30-34) **đã gần xong** → bảo trì + viết test.
- **Parent (trọng tâm):** UC24 (thay mock bằng API thật), UC25, UC26, UC27, UC28.

## Phụ thuộc chéo
- **UC24/UC26** đọc dữ liệu quiz (TV3) + Order (TV1) **qua API**, không query thẳng bảng.
- Sở hữu schema `ParentStudentLink`, `Question` — phối hợp khi GV tạo khóa (Course do TV2 sở hữu).
