# TV5 — Mỹ Tâm · Quản trị (Admin) & Khiếu nại

**UC phụ trách:** UC38 (Dashboard) · UC39 (DS tài khoản) · UC40 (Mở/khóa tài khoản) · UC41 (Duyệt khóa học) ·
UC12 (HS/PH gửi khiếu nại) · UC42 (Admin xử lý khiếu nại) · UC26-hỗ trợ (lịch sử thanh toán — phối hợp TV4).

## File đang phụ trách (đã có trong thư mục)
- **Backend:** AdminDashboard/AdminUser/AdminApproval/Complaint (controller+service), model/repo ApprovalHistory,
  Complaint, ComplaintMessage. *(Lưu ý: Complaint* đã được dựng sẵn một phần — kiểm tra trước khi viết mới.)*
- **Frontend:** DashboardAdmin, ApprovalsPage, CourseReviewPage, ComplaintsPage (student/teacher),
  `adminService.ts`, `complaintService.ts`, `components/admin/ComplaintsInbox`.

## File cần TẠO MỚI / HOÀN THIỆN
- Hoàn thiện luồng khiếu nại HS/PH ↔ Admin (UC12 gửi, UC42 xử lý) nếu phần đã dựng còn thiếu
- **Wire FE** tab Users vào AdminUserController có sẵn (UC39, UC40) · hoàn thiện CourseReviewPage (UC41)

## Việc còn phải code
- **UC12 + UC42:** hệ thống khiếu nại (kiểm tra Complaint* đã có → bổ sung phần còn thiếu, không viết lại).
- **UC39/UC40:** wire FE quản lý user (block/unblock, đổi vai trò) — BE đã có.
- **UC41:** hoàn thiện màn duyệt/từ chối/yêu cầu sửa khóa học.

## Phụ thuộc chéo
- `Notification` (gửi kết quả khiếu nại/duyệt khóa) gọi **API `notify()` của TV1** (UC44), không tự dựng.
- Đọc `Order`/`Course` qua API của TV1/TV2.
