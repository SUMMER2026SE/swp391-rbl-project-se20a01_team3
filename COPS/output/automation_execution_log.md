# Nhật ký thực thi tự động hóa Bee Academy COPS

- Thời gian bắt đầu: 2026-07-22 (Asia/Ho_Chi_Minh)
- Thời gian kết thúc: 2026-07-22 18:50:36 +07:00
- Source commit: `209b0e98a4d04028ed76dcdaa1551ad6be179542`
- Môi trường: local/test; frontend `http://localhost:3000`, backend `http://localhost:8080`
- Viewport: 1440 × 900, zoom 100%

## Lệnh/kiểm tra đã thực hiện

- `npm.cmd run lint` — Passed (`tsc --noEmit`).
- `mvn.cmd -q -DskipTests compile` — Passed.
- HTTP GET frontend `/courses` — 200.
- HTTP GET backend `/api/courses?page=0&size=1` — 200.
- Browser UI: trang chủ, danh sách khóa học, chi tiết khóa học, tab Nội dung học, đăng ký, đăng nhập, quên mật khẩu.

## Tài khoản kiểm thử

- Đã thử tài khoản Student: `student.cops@beeacademy.test`.
- Các tài khoản Parent/Teacher/Admin không được sử dụng vì bước đăng nhập chung bị chặn.
- Không ghi mật khẩu vào log.

## Kết quả

- Passed: REQ-CRS-001, REQ-CRS-002.
- Blocked: 42/44 requirement.
- Lỗi chính: sau khi gửi biểu mẫu đăng nhập, UI hiển thị “Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau.”
- REQ-CRS-003 bị chặn do dữ liệu hiện tại không có lesson mở miễn phí; tất cả bài trong khóa Công Nghệ 6 đều hiển thị “Cần mua khóa”.
- Không thực hiện thanh toán thật, OTP thật, email thật hoặc thay đổi dữ liệu nghiệp vụ.

## Retest sau khi dịch vụ xác thực hoạt động trở lại

- Thời gian retest: 22/07/2026 (Asia/Ho_Chi_Minh).
- Cả 4 tài khoản Student, Parent, Teacher và Admin đăng nhập thành công và điều hướng đúng dashboard.
- Đã truy cập các route nghiệp vụ của 4 vai trò và xác minh giao diện/empty state theo dữ liệu hiện có.
- Kết quả mới: 8 PASSED, 15 PARTIAL, 19 BLOCKED, 2 FAILED.
- FAILED 1: nút Đăng xuất không phản hồi tại một số trang con Giáo viên/Admin.
- FAILED 2: nút Xuất báo cáo Excel tại trang chi trả Admin không tạo file tải xuống trong 10 giây.
- Không bấm xác nhận chuyển khoản, khóa/cấp lại mật khẩu tài khoản, phát thông báo, gửi email/OTP hoặc thanh toán thật.

## Cách xử lý đã thử

- Xác nhận frontend và backend local đều trả HTTP 200.
- Kiểm tra lại selector từ DOM thực tế.
- Thử đăng nhập một lần bằng tài khoản test được cung cấp.
- Thu thập screenshot lỗi và browser console log trong `output/logs/`.
- Dừng các workflow phụ thuộc đăng nhập để tránh tạo kết quả giả.

## File đầu ra

- `BeeAcademy_COPS_Final_Report.docx`
- `BeeAcademy_COPS_Final_Report.pdf`
- `feature_coverage_matrix.xlsx`
- `screenshot_manifest.xlsx`
- `unimplemented_functions.xlsx`
- `COPS_QA_Report.md`
- `screenshots/`, `screenshots-original/`, `logs/`
- `../automation/playwright/`

## Tiếp tục retest và hoàn thiện tài liệu — 23/07/2026

- Xác nhận frontend `http://localhost:3000` và backend `http://localhost:8080` phản hồi HTTP 200 trong môi trường local/test.
- Bổ sung 38 screenshot UI thực tế cho các vai trò Student, Parent, Teacher và Admin; tổng manifest/highlighted là 47 ảnh.
- Đồng bộ lại `feature_coverage_matrix.xlsx`, `screenshot_manifest.xlsx` và `unimplemented_functions.xlsx` theo manifest mới.
- Build lại báo cáo Word hoàn chỉnh 55 trang với TOC, caption, bằng chứng và bảng QA; đồng thời cập nhật `COPS_Retest.docx`.
- Xuất PDF bằng Microsoft Word và rasterize toàn bộ 55 trang bằng pypdfium2 để kiểm tra trực quan; không có lỗi clipping/overlap/overflow trong các contact sheet đã rà soát.
- Không thay đổi business logic; các hành động nhạy cảm (thanh toán thật, OTP/email thật, thay đổi production) vẫn không được thực hiện.
