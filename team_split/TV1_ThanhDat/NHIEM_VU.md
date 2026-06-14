# TV1 — Thành Đạt · Auth, Thanh toán & Hạ tầng

**UC phụ trách:** UC01-05 (Auth/Tài khoản) · UC09, UC10, UC11 (Mua/Thanh toán/Lịch sử) · UC37 (Doanh thu GV)
· UC43 (Xác nhận payout + xuất Excel) · UC44 (Hệ thống thông báo).

## File đang phụ trách (đã có trong thư mục)
- **Backend:** Auth/Profile (controller+service+repo+model), Order/PayOS, TeacherRevenue, Bank (TK ngân hàng GV),
  các model/repo Order/RevenueSplit/PayoutPeriod.
- **Frontend:** Login/Register/ForgotPassword/OAuthCallback, Account/Profile/Avatar, Checkout/PaymentResult/Orders,
  RevenuePage, BankPage, các service auth/order/revenue/bank, `client.ts`, layout components, `ProtectedRoute`,
  `components/admin/PayoutsPanel`.

## File cần TẠO MỚI
- `backend/.../controller/PayoutController.java` + endpoint xác nhận chuyển khoản & **xuất Excel (Apache POI)** — UC43
- `backend/.../controller/NotificationController.java` + `service/NotificationService.java` + `model/Notification.java` — UC44
- `frontend/.../pages/admin/PayoutConfirmPage.tsx` (xác nhận + tải Excel) · trung tâm thông báo + trang gửi thông báo

## Việc còn phải code
- **UC43:** Admin tích chọn GV đã chuyển khoản → nhập ngày CK/nội dung/UNC → CONFIRMED + xuất Excel danh sách GV.
- **UC44:** Thông báo in-app + email, cung cấp **1 API `notify()` dùng chung** cho mọi module gọi vào.
- **UC11:** OrdersPage bỏ fallback Zustand, dùng API thật.
- Thanh toán PayOS (UC09/10), Auth (UC01-05) **đã xong** → bảo trì + viết test (idempotent webhook, PAID/FAILED/CANCELLED).

## Trách nhiệm hạ tầng (chỉ TV1 sửa)
`client.ts`, `App.tsx`, `ProtectedRoute`, Spring Security/JWT, CORS, GlobalExceptionHandler, `dto/` chung,
`application.yml`, **thư mục migration SQL (đánh số thứ tự)**. Điều phối merge, review PR, xử lý conflict.
