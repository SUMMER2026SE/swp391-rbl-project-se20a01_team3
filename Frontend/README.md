# FE2: User Settings UI, Profile Page, Avatar Upload & Global API Config

## 📋 Nhiệm vụ chính
1. **Quản lý Hồ sơ cá nhân (Profile):** Cập nhật thông tin chi tiết người dùng, tích hợp toolbar định dạng Markdown (Bold/Italic) cho ô nhập tiểu sử (Bio).
2. **Cài đặt Tài khoản & Quên mật khẩu:** Trang đổi mật khẩu (yêu cầu mật khẩu cũ) và luồng Quên mật khẩu (nhập email ➔ gửi mã OTP ➔ đặt mật khẩu mới).
3. **Upload ảnh đại diện (Avatar):** Giao diện kéo thả file ảnh, kiểm tra dung lượng ≤ 2MB, xem trước hình ảnh và gọi API tải lên multipart/form-data.
4. **Cấu hình Axios Interceptors:** Đính kèm JWT tự động vào request headers và bắt lỗi 401 toàn cục để logout đẩy về `/login`.

## 📂 Danh sách các file trong thư mục của bạn
* `ProfilePage.tsx`: Trang chỉnh sửa thông tin cá nhân và Markdown toolbar cho tiểu sử.
* `AccountPage.tsx`: Trang đổi mật khẩu và xem hiển thị Email.
* `AvatarPage.tsx`: Trang Drag-Drop tải ảnh đại diện, validate dung lượng và gọi API upload.
* `ForgotPassword.tsx`: Trang quên mật khẩu 3 bước xác thực OTP.
* `client.ts`: File cấu hình chung cho Axios instance (`apiClient`) và interceptors.
* `DashboardHeader.tsx`: Header hiển thị tên & hình đại diện người dùng, đồng bộ khi upload avatar xong.
* `authService.ts`: Các hàm API client liên quan đến Profile và Upload Avatar.
* `api.ts`: Danh sách các kiểu dữ liệu DTO phản hồi từ APIs của backend.
