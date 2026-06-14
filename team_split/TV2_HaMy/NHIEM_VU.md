# TV2 — Hà My · Học tập cốt lõi & Chứng chỉ

**UC phụ trách:** UC06, UC07, UC08 (Tìm kiếm/Chi tiết/Học thử) · UC13, UC14 (Khóa đã mua/Bài giảng) ·
UC15 (Tải tài liệu) · UC19 (Đánh giá) · UC20 (Chứng chỉ).

## File đang phụ trách (đã có trong thư mục)
- **Backend:** CourseController/Service, EnrollmentController/Service, CategoryController, các model/repo
  Course/Chapter/Lesson/Enrollment/Category/CourseDocument.
- **Frontend:** CoursesPage, CourseDetailPage, FavoritesPage, `courseService.ts`, `enrollmentService.ts`.

## File cần TẠO MỚI
- `backend/.../model/Review.java` + `controller/ReviewController.java` + `service/ReviewService.java` — UC19
- `backend/.../model/Certificate.java` + `controller/CertificateController.java` + `service/CertificateService.java`
  (sinh PDF + QR + trang xác minh công khai) — UC20
- Bổ sung **signed URL + watermark** cho tải tài liệu trong CourseService/ContentUpload — UC15
- `frontend/.../pages/student/CertificatesPage.tsx` · UI đánh giá sao + review · UI tải tài liệu

## Việc còn phải code
- **UC15:** tải tài liệu có bảo mật (signed URL hết hạn + watermark tên/email HS).
- **UC19:** đánh giá khóa (sao + nhận xét) — BE+FE mới.
- **UC20:** chứng chỉ PDF + QR + trang xác minh — module mới.
- **UC08:** đánh dấu/hiển thị bài học thử (isFree) rõ ràng.

## Phụ thuộc chéo
- **UC20** cần điều kiện *pass bài kiểm tra cuối* → lấy qua API của **TV3**.
- Sở hữu schema `Course/Chapter/Lesson` — TV4 (GV tạo) & TV5 (duyệt) xin thêm cột qua TV2.
