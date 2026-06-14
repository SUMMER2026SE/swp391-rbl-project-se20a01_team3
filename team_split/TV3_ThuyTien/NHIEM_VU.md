# TV3 — Thủy Tiên · Khảo thí, Bài tập & Tương tác học

**UC phụ trách:** UC16 (Nộp bài tập) · UC17 (Làm bài kiểm tra) · UC18 (Điểm & tiến độ HS) · UC21 (Hỏi GV) ·
UC35 (Chấm bài tập) · UC36 (GV trả lời) · *UC22, UC23 (AI — mở rộng)*.

## File đang phụ trách (đã có trong thư mục)
- **Backend:** Quiz/Exam/Qa (controller+service), các model/repo QuizConfig/QuizAttempt/ExamConfig/QaThread/QaMessage.
- **Frontend:** StudentQuizPage, MessagesPage (Q&A), TeacherGradesPage, TeacherQAPage, `quizService/examService/qaService`.

## File cần TẠO MỚI
- `backend/.../model/Assignment.java` + `model/AssignmentSubmission.java` + controller + service — UC16
- Endpoint chấm điểm bài tập (gắn vào assignment) — UC35
- Endpoint tổng hợp điểm & tiến độ học sinh — UC18
- `frontend/.../pages/student/AssignmentPage.tsx` · trang tiến độ HS · wire TeacherGradesPage để chấm
- *(Mở rộng)* `AiController`/`AiService` + widget Chat AI / trang Lộ trình — UC22/UC23

## Việc còn phải code
- **UC16 + UC35:** hệ thống nộp bài tập + chấm điểm (model mới, BE+FE).
- **UC18:** trang điểm & tiến độ riêng cho học sinh.
- *Mở rộng:* UC22 Chat AI, UC23 Lộ trình AI (chỉ khi còn thời gian / làm bản rule-based).

## Phụ thuộc chéo
- **UC18** dùng dữ liệu quiz/bài tập (TV3) + enrollment (TV2) → thống nhất công thức % hoàn thành.
- Cung cấp API "HS đã pass bài kiểm tra cuối?" cho **TV2** (UC20 chứng chỉ).
