# Báo cáo QA tài liệu Bee Academy COPS

## A. Requirement coverage

- Tổng số requirement theo phạm vi yêu cầu: 44.
- Số requirement có mặt trong tài liệu: 44.
- Passed trên UI: 8.
- Partial: 15.
- Blocked/chưa thể kiểm thử: 19.
- Failed: 2.
- Requirement còn thiếu trong tài liệu: 0.

## B. Screenshot validation

- 47 ảnh highlighted tồn tại và đã được kiểm tra trực quan (9 ảnh nền có sẵn + 38 ảnh giao diện bổ sung cho Student, Parent, Teacher và Admin).
- Ảnh đúng màn hình/role công khai; các ảnh đăng nhập chỉ dùng tài khoản test.
- Viền đỏ `#FF0000`, dày 3 px, nền trong suốt, không cắt mép ảnh.
- Không có mật khẩu hiển thị rõ; không có token, OTP, dữ liệu thanh toán hoặc thông tin ngân hàng thật.
- REQ-CRS-003 được ghi BLOCKED vì ảnh cho thấy toàn bộ bài hiện tại yêu cầu mua khóa.

## C. Document validation

- Khổ A4, lề và hệ thống Heading kế thừa từ mẫu COPS.
- Có Heading 1/2/3 thật, mục lục tự động, footer số trang và caption duy nhất.
- Các bảng đặt trong vùng nội dung, hàng tiêu đề được đánh dấu lặp lại.
- Không có placeholder chưa điền hoặc “Error! Bookmark not defined”.
- DOCX được xuất PDF bằng Microsoft Word và render toàn bộ 55 trang thành PNG để kiểm tra; LibreOffice không có sẵn trong môi trường.

## D. Functional validation

- REQ-AUTH-002 đã retest thành công với đủ 4 vai trò Student, Parent, Teacher và Admin.
- REQ-CRS-001 và REQ-CRS-002 có happy path quan sát được.
- Các màn hình nghiệp vụ theo vai trò đã được mở và phân loại lại theo Passed/Partial/Blocked/Failed.
- Các route và màn hình bằng chứng bổ sung cho Student, Parent, Teacher và Admin đã được chụp lại từ UI đang chạy và gắn viền đỏ trong tài liệu.
- REQ-AUTH-003 Failed do nút đăng xuất không phản hồi tại một số trang con Giáo viên/Admin.
- REQ-ADM-006 Failed do nút xuất báo cáo Excel không tạo file tải xuống trong 10 giây.
- Không thực hiện thanh toán thật, OTP thật, gửi email thật hay thay đổi dữ liệu production.
- Chi tiết từng requirement nằm trong `feature_coverage_matrix.xlsx` và `unimplemented_functions.xlsx`.
