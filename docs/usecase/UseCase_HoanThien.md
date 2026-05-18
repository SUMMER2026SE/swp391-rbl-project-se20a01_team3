# USE CASE SPECIFICATION — BEE ACADEMY
> Phiên bản: 2.0 | Cập nhật: 17/05/2026

---

## MỤC LỤC

1. [Danh sách Actor](#1-danh-sách-actor)
2. [Sơ đồ tổng quan mối quan hệ Actor](#2-sơ-đồ-tổng-quan)
3. [Danh sách Use Case theo Module](#3-danh-sách-use-case-theo-module)
4. [Đặc tả Use Case chi tiết](#4-đặc-tả-use-case-chi-tiết)

---

## 1. DANH SÁCH ACTOR

| ID | Actor | Loại | Mô tả |
|----|-------|------|-------|
| A01 | **Guest (Khách)** | Primary | Người dùng chưa đăng nhập, truy cập tự do các trang công khai |
| A02 | **Học sinh** | Primary | Kế thừa Guest — người học đã đăng ký tài khoản và mua khóa học |
| A03 | **Phụ huynh** | Primary | Kế thừa Guest — người giám hộ theo dõi việc học và thanh toán cho con |
| A04 | **Giáo viên** | Primary | Người tạo và quản lý nội dung khóa học, tương tác với học sinh |
| A05 | **Quản trị viên (Admin)** | Primary | Quản lý toàn bộ hệ thống, người dùng, nội dung và báo cáo |
| A06 | **«external» AI Engine** | Secondary | Hệ thống AI bên ngoài (tích hợp qua API) hỗ trợ học tập |
| A07 | **«external» Payment Gateway** | Secondary | Cổng thanh toán bên ngoài: VNPay, MoMo |

> **Lưu ý kế thừa Actor:**
> - Học sinh `extends` Guest (có thêm quyền sau khi đăng nhập + mua khóa)
> - Phụ huynh `extends` Guest (có thêm quyền theo dõi con + thanh toán)
> - Admin `includes` tất cả quyền quản trị hệ thống

---

## 2. SƠ ĐỒ TỔNG QUAN

```
                    ┌─────────────────────────────────────────────────┐
                    │                  BEE ACADEMY SYSTEM              │
                    │                                                   │
  A01 Guest ────────┤── Xem trang chủ                                  │
       │            │── Xem danh sách khóa học                        │
       │            │── Tìm kiếm / lọc khóa học                       │
       │            │── Xem chi tiết khóa học                         │
       │            │── Đăng ký tài khoản                             │
       │            │── Đăng nhập ─────────────────────────────────── │
       │                                                               │
  A02 Học sinh ─────┤── (kế thừa Guest) +                             │
       │            │── Mua khóa học ──────────────── <<include>> ────►│──► A07 Payment
       │            │── Xem bài giảng                                  │
       │            │── Làm bài tập / quiz                             │
       │            │── Chat với AI ───────────────── <<include>> ────►│──► A06 AI
       │            │── Theo dõi tiến độ                               │
       │            │── Đánh giá khóa học                              │
       │                                                               │
  A03 Phụ huynh ────┤── (kế thừa Guest) +                             │
       │            │── Theo dõi kết quả học của con                   │
       │            │── Mua khóa học cho con ──── <<include>> ────────►│──► A07 Payment
       │            │── Liên hệ giáo viên                              │
       │                                                               │
  A04 Giáo viên ────┤── Quản lý khóa học / bài giảng                  │
       │            │── Tạo bài tập / kiểm tra                         │
       │            │── Chấm điểm                                      │
       │            │── Theo dõi tiến độ lớp                           │
       │                                                               │
  A05 Admin ────────┤── Quản lý người dùng (CRUD)                     │
                    │── Quản lý nội dung / danh mục                    │
                    │── Quản lý đơn hàng / doanh thu                   │
                    │── Cấu hình hệ thống                              │
                    └─────────────────────────────────────────────────┘
```

---

## 3. DANH SÁCH USE CASE THEO MODULE

> **Phiên bản 3.0 — Đã gộp từ 105 UC → 62 UC** để thuận lợi vẽ Use Case Diagram.
> Mỗi UC gộp ghi rõ các UC gốc được hợp nhất trong cột "Gộp từ".

### Module 1 — Xác thực & Tài khoản (6 UC)

| ID | Use Case | Actor | Quan hệ | Gộp từ |
|----|----------|-------|---------|--------|
| UC01 | Đăng ký tài khoản | Guest | — | — |
| UC02 | Đăng nhập | Học sinh, Phụ huynh, Giáo viên, Admin | — | UC02, UC03 |
| UC03 | Đăng xuất | Học sinh, Phụ huynh, Giáo viên, Admin | — | UC04 |
| UC04 | Quên & Đặt lại mật khẩu | Guest | — | UC05, UC06, UC07 |
| UC05 | Cập nhật hồ sơ cá nhân | Học sinh, Phụ huynh, Giáo viên | — | UC08, UC10 |
| UC06 | Đổi mật khẩu | Học sinh, Phụ huynh, Giáo viên, Admin | — | UC09 |

---

### Module 2 — Duyệt & Tìm kiếm Khóa học (9 UC)

| ID | Use Case | Actor | Quan hệ | Gộp từ |
|----|----------|-------|---------|--------|
| UC07 | Xem trang chủ | Guest | — | UC11 |
| UC08 | Xem danh sách khóa học | Guest | — | UC12 |
| UC09 | Tìm kiếm & Lọc khóa học | Guest | `<<extend>>` UC08 | UC13, UC14, UC19 |
| UC10 | Xem danh mục khóa học | Guest | `<<extend>>` UC08 | — |
| UC11 | Xem chi tiết khóa học | Guest | — | UC15, UC16 |
| UC12 | Xem bài học thử miễn phí | Guest | `<<extend>>` UC11 | UC17 |
| UC13 | Xem đánh giá khóa học | Guest | `<<extend>>` UC11 | UC18 |
| UC14 | Xem Blog / Tin tức | Guest | — | UC22, UC23 |
| UC15 | Xem thông tin & Liên hệ | Guest | — | UC20, UC21 |

---

### Module 3 — Thanh toán & Mua khóa học (7 UC)

| ID | Use Case | Actor | Quan hệ | Gộp từ |
|----|----------|-------|---------|--------|
| UC16 | Quản lý giỏ hàng | Học sinh, Phụ huynh | — | UC24, UC25, UC26 |
| UC17 | Mua khóa học | Học sinh, Phụ huynh | `<<include>>` UC18 | UC27 |
| UC18 | Thanh toán qua VNPay / MoMo | Học sinh, Phụ huynh | → A07 Payment Gateway | UC28, UC29, UC32 |
| UC19 | Mua khóa học cho con | Phụ huynh | `<<include>>` UC18 | UC34 |
| UC20 | Xem lịch sử & Chi tiết đơn hàng | Học sinh, Phụ huynh | — | UC30, UC31 |
| UC21 | Nhận hóa đơn qua email | Học sinh, Phụ huynh | `<<include>>` UC18 | UC32 |
| UC22 | Yêu cầu hoàn tiền | Học sinh, Phụ huynh | — | UC33 |

---

### Module 4 — Học tập (10 UC)

| ID | Use Case | Actor | Quan hệ | Gộp từ |
|----|----------|-------|---------|--------|
| UC23 | Xem danh sách khóa học đã mua | Học sinh | — | UC35, UC36 |
| UC24 | Xem bài giảng / Video | Học sinh | — | UC37, UC38 |
| UC25 | Tải tài liệu học tập | Học sinh | — | UC39 |
| UC26 | Làm & Nộp bài tập | Học sinh | — | UC40, UC41 |
| UC27 | Làm quiz & Kiểm tra online | Học sinh | — | UC42, UC43 |
| UC28 | Xem điểm & Kết quả | Học sinh | — | UC44 |
| UC29 | Theo dõi tiến độ & Xem chứng chỉ | Học sinh | — | UC45, UC46, UC47 |
| UC30 | Đánh giá khóa học | Học sinh | — | UC48 |
| UC31 | Gửi câu hỏi cho giáo viên | Học sinh | — | UC49 |
| UC32 | Nhận thông báo & Tham gia lớp online | Học sinh | — | UC50, UC51 |

---

### Module 5 — AI Hỗ trợ học tập (3 UC)

| ID | Use Case | Actor | Quan hệ | Gộp từ |
|----|----------|-------|---------|--------|
| UC33 | Chat với AI hỗ trợ học tập | Học sinh | → A06 AI Engine | UC52, UC53, UC54, UC55 |
| UC34 | Sử dụng tính năng AI Quiz | Học sinh | `<<extend>>` UC27 | UC56 |
| UC35 | Xem đề xuất học tập từ AI | Học sinh | `<<extend>>` UC28, UC29 | UC57, UC58, UC59 |

---

### Module 6 — Phụ huynh (6 UC)

| ID | Use Case | Actor | Quan hệ | Gộp từ |
|----|----------|-------|---------|--------|
| UC36 | Theo dõi kết quả & Tiến độ học của con | Phụ huynh | — | UC60, UC63 |
| UC37 | Xem thời khóa biểu & Lịch kiểm tra | Phụ huynh | — | UC61, UC64 |
| UC38 | Theo dõi chuyên cần của con | Phụ huynh | — | UC62 |
| UC39 | Liên hệ giáo viên | Phụ huynh | — | UC65 |
| UC40 | Nhận thông báo từ hệ thống | Phụ huynh | — | UC66 |
| UC41 | Xem lịch sử thanh toán | Phụ huynh | — | UC67 |

---

### Module 7 — Giáo viên (8 UC)

| ID | Use Case | Actor | Quan hệ | Gộp từ |
|----|----------|-------|---------|--------|
| UC42 | Xem dashboard giảng dạy | Giáo viên | — | UC68 |
| UC45 | Tạo bài tập | Giáo viên | — | UC74 |
| UC46 | Tạo bài kiểm tra / Quiz | Giáo viên | — | UC75 |
| UC47 | Chấm điểm | Giáo viên | — | UC76 |
| UC48 | Quản lý học viên & Điểm danh | Giáo viên | — | UC77, UC78 |
| UC49 | Theo dõi tiến độ lớp học | Giáo viên | — | UC79, UC80 |
| UC50 | Trả lời câu hỏi & Gửi thông báo | Giáo viên | `<<extend>>` UC31 | UC81, UC82 |
| UC51 | Quản lý lớp online & Xem thống kê | Giáo viên | — | UC83, UC84 |

---

### Module 8 — Quản trị viên (Admin) (13 UC)

| ID | Use Case | Actor | Quan hệ | Gộp từ |
|----|----------|-------|---------|--------|
| UC43 | Tạo & Quản lý khóa học | Admin | — | UC69, UC70, UC71 |
| UC44 | Quản lý bài giảng & Tài liệu | Admin | `<<include>>` UC43 | UC72, UC73 |
| UC52 | Xem dashboard quản trị | Admin | — | UC85 |
| UC53 | Quản lý tài khoản người dùng | Admin | — | UC86, UC87, UC88, UC89, UC90 |
| UC54 | Phân quyền người dùng | Admin | — | UC91 |
| UC55 | Quản lý danh mục & Nội dung khóa học | Admin | — | UC92, UC93 |
| UC56 | Quản lý lớp học & Lịch học | Admin | — | UC94, UC95 |
| UC57 | Quản lý đơn hàng | Admin | — | UC96 |
| UC58 | Xem doanh thu & Xuất báo cáo | Admin | — | UC97, UC98 |
| UC59 | Xử lý hoàn tiền | Admin | `<<extend>>` UC22 | UC99 |
| UC60 | Quản lý Blog | Admin | — | UC100 |
| UC61 | Gửi thông báo & Giám sát hoạt động | Admin | — | UC101, UC102 |
| UC62 | Sao lưu, Khôi phục & Cấu hình hệ thống | Admin | — | UC103, UC104, UC105 |

---

## 4. ĐẶC TẢ USE CASE CHI TIẾT

> Dưới đây là đặc tả chi tiết cho các use case quan trọng nhất theo mẫu chuẩn.

---

### UC01 — Đăng ký tài khoản

| Trường | Nội dung |
|--------|----------|
| **Mã UC** | UC01 |
| **Tên** | Đăng ký tài khoản |
| **Actor** | Guest |
| **Mô tả** | Khách chưa có tài khoản điền thông tin để tạo tài khoản mới |
| **Tiền điều kiện** | Actor chưa đăng nhập; truy cập trang `/auth/register` |
| **Hậu điều kiện** | Tài khoản mới được tạo; actor được chuyển đến trang đăng nhập |
| **Luồng chính** | 1. Guest nhập họ tên, email, mật khẩu, xác nhận mật khẩu |
| | 2. Guest chọn vai trò: Học sinh / Phụ huynh |
| | 3. Hệ thống kiểm tra email chưa tồn tại trong DB |
| | 4. Hệ thống validate dữ liệu (Zod schema) |
| | 5. Hệ thống tạo tài khoản, lưu mật khẩu đã hash (bcrypt) |
| | 6. Hệ thống gửi email xác nhận tài khoản |
| | 7. Hiển thị thông báo thành công, chuyển hướng đến trang đăng nhập |
| **Luồng thay thế** | 3a. Email đã tồn tại → hiển thị lỗi "Email này đã được đăng ký" |
| | 4a. Dữ liệu không hợp lệ → hiển thị lỗi inline từng trường |
| **Ngoại lệ** | Lỗi kết nối DB → hiển thị thông báo lỗi hệ thống |

---

### UC02 — Đăng nhập

| Trường | Nội dung |
|--------|----------|
| **Mã UC** | UC02 |
| **Tên** | Đăng nhập |
| **Actor** | Học sinh, Phụ huynh, Giáo viên, Admin |
| **Mô tả** | Actor nhập thông tin xác thực để truy cập hệ thống |
| **Tiền điều kiện** | Actor đã có tài khoản; truy cập `/auth/login` |
| **Hậu điều kiện** | Actor đăng nhập thành công; session/JWT được tạo; chuyển đến trang phù hợp vai trò |
| **Luồng chính** | 1. Actor nhập email + mật khẩu |
| | 2. Actor nhấn "Đăng nhập" |
| | 3. `<<include>>` UC03: Hệ thống xác thực thông tin |
| | 4. Hệ thống kiểm tra vai trò (role) |
| | 5. Tạo session / JWT token |
| | 6. Chuyển hướng: Học sinh → `/dashboard`, Admin → `/admin`, Giáo viên → dashboard giảng dạy |
| **Luồng thay thế** | 3a. Sai email hoặc mật khẩu → hiển thị lỗi chung (không tiết lộ thông tin nào sai) |
| | 3b. Tài khoản bị khóa → thông báo "Tài khoản đã bị khóa, liên hệ admin" |
| | 3c. Tài khoản chưa xác nhận email → thông báo yêu cầu xác nhận |
| **Ngoại lệ** | Quá 5 lần thất bại → khóa đăng nhập 15 phút (rate limiting) |

---

### UC17 — Mua khóa học (Checkout)

| Trường | Nội dung |
|--------|----------|
| **Mã UC** | UC17 |
| **Tên** | Mua khóa học |
| **Actor** | Học sinh, Phụ huynh |
| **Mô tả** | Actor chọn phương thức thanh toán và hoàn tất mua khóa học |
| **Tiền điều kiện** | Actor đã đăng nhập; có ít nhất 1 khóa học trong giỏ hàng (UC16) |
| **Hậu điều kiện** | Đơn hàng được tạo; học sinh có quyền truy cập khóa học; hóa đơn được gửi qua email |
| **Luồng chính** | 1. Actor xem lại giỏ hàng, kiểm tra tổng tiền |
| | 2. Actor chọn phương thức: VNPay hoặc MoMo |
| | 3. Hệ thống tạo đơn hàng tạm (trạng thái PENDING) |
| | 4. `<<include>>` UC18: Chuyển sang cổng thanh toán A07 |
| | 5. Actor hoàn tất thanh toán trên cổng |
| | 6. Cổng thanh toán callback xác nhận thành công |
| | 7. Hệ thống cập nhật trạng thái đơn hàng → COMPLETED |
| | 8. Tạo Enrollment cho học sinh |
| | 9. `<<include>>` UC21: Gửi hóa đơn qua email |
| | 10. Chuyển hướng đến trang "Mua hàng thành công" |
| **Luồng thay thế** | 6a. Thanh toán thất bại / hủy → cập nhật đơn hàng → CANCELLED, thông báo thất bại |
| | 6b. Timeout sau 15 phút → hủy đơn hàng tự động |
| **Ngoại lệ** | Callback bị mất → cron job kiểm tra lại trạng thái sau 5 phút |

---

### UC24 — Xem bài giảng / Video

| Trường | Nội dung |
|--------|----------|
| **Mã UC** | UC24 |
| **Tên** | Xem bài giảng / Video |
| **Actor** | Học sinh |
| **Mô tả** | Học sinh xem video bài giảng, tiến độ được lưu tự động (gộp từ UC37 + UC38) |
| **Tiền điều kiện** | Học sinh đã đăng nhập; đã mua khóa học hoặc bài học có flag isFree = true |
| **Hậu điều kiện** | Tiến độ xem video được lưu; cập nhật % hoàn thành khóa học trong Enrollment |
| **Luồng chính** | 1. Học sinh chọn bài giảng từ curriculum |
| | 2. Hệ thống kiểm tra quyền truy cập (đã mua / bài miễn phí) |
| | 3. Hệ thống tải video từ Cloudinary |
| | 4. Video player hiển thị, học sinh xem |
| | 5. Hệ thống tự động lưu % xem mỗi 30 giây |
| | 6. Khi hoàn thành (≥90% video): đánh dấu bài học DONE |
| | 7. Cập nhật % tiến độ khóa học trong Enrollment |
| **Luồng thay thế** | 2a. Chưa mua khóa học → hiển thị modal "Mua khóa học để xem đầy đủ" + CTA |
| | 3a. Lỗi tải video → hiển thị thông báo lỗi + nút thử lại |

---

### UC27 — Làm quiz & Kiểm tra online

| Trường | Nội dung |
|--------|----------|
| **Mã UC** | UC27 |
| **Tên** | Làm quiz & Kiểm tra online |
| **Actor** | Học sinh |
| **Mô tả** | Học sinh thực hiện bài kiểm tra, kết quả được tính tự động (gộp từ UC42 + UC43) |
| **Tiền điều kiện** | Học sinh đã đăng nhập; đã mua khóa học; bài kiểm tra đang mở |
| **Hậu điều kiện** | Kết quả được lưu; điểm được tính và hiển thị; cập nhật vào bảng điểm |
| **Luồng chính** | 1. Học sinh chọn bài quiz từ danh sách |
| | 2. Hệ thống hiển thị thông tin: số câu, thời gian, điểm đậu |
| | 3. Học sinh nhấn "Bắt đầu làm bài" |
| | 4. Hệ thống bắt đầu đếm ngược thời gian |
| | 5. Học sinh lần lượt trả lời từng câu hỏi |
| | 6. Nộp bài (hoặc tự động nộp khi hết giờ) |
| | 7. Hệ thống chấm điểm tự động |
| | 8. Hiển thị kết quả: điểm số, câu đúng/sai, giải thích đáp án |
| **Luồng thay thế** | 4a. Hết thời gian → tự động nộp bài với các câu đã trả lời |
| | 5a. Mất kết nối → lưu tạm câu trả lời local, tiếp tục khi có mạng |
| **Mở rộng** | `<<extend>>` UC34: AI tạo bộ câu hỏi ngẫu nhiên theo topic khi bật AI Quiz mode |

---

### UC43 — Tạo & Quản lý khóa học

| Trường | Nội dung |
|--------|----------|
| **Mã UC** | UC43 |
| **Tên** | Tạo & Quản lý khóa học |
| **Actor** | Admin |
| **Mô tả** | Admin tạo, chỉnh sửa và xuất bản khóa học (gộp từ UC69 + UC70 + UC71) |
| **Tiền điều kiện** | Admin đã đăng nhập |
| **Hậu điều kiện** | Khóa học được tạo / cập nhật; trạng thái thay đổi theo hành động (DRAFT / PUBLISHED) |
| **Luồng chính** | 1. Admin vào trang "Quản lý khóa học" |
| | 2. Chọn Tạo mới hoặc Chỉnh sửa khóa học đã có |
| | 3. Nhập / cập nhật: tên, mô tả, danh mục, cấp lớp, giá, giá sale |
| | 4. Upload / thay ảnh thumbnail lên Cloudinary |
| | 5. `<<include>>` UC44: Quản lý bài giảng & tài liệu theo chương |
| | 6. Lưu nháp (DRAFT) |
| | 7. Khi sẵn sàng: Xuất bản → trạng thái PUBLISHED |
| **Luồng thay thế** | 4a. Upload ảnh thất bại → thông báo lỗi, yêu cầu thử lại |

---

### UC58 — Xem doanh thu & Xuất báo cáo

| Trường | Nội dung |
|--------|----------|
| **Mã UC** | UC58 |
| **Tên** | Xem doanh thu & Xuất báo cáo |
| **Actor** | Admin |
| **Mô tả** | Admin xem tổng quan doanh thu và xuất báo cáo ra file (gộp từ UC97 + UC98) |
| **Tiền điều kiện** | Admin đã đăng nhập; có quyền xem báo cáo tài chính |
| **Hậu điều kiện** | Báo cáo được hiển thị; file xuất được tải về nếu yêu cầu |
| **Luồng chính** | 1. Admin chọn khoảng thời gian (hôm nay / tuần / tháng / tùy chỉnh) |
| | 2. Hệ thống tổng hợp: tổng doanh thu, số đơn hàng, số học viên mới |
| | 3. Hiển thị biểu đồ doanh thu theo ngày |
| | 4. Hiển thị top khóa học bán chạy |
| | 5. Hiển thị bảng chi tiết từng giao dịch |
| | 6. Admin nhấn "Xuất báo cáo" → tải về file Excel / PDF |

---

## 5. TỔNG HỢP THỐNG KÊ

| Hạng mục | Số lượng |
|----------|---------|
| Phiên bản | 3.0 (Gộp 105 → 62 UC) |
| Tổng số Actor | 7 (5 Primary + 2 External System) |
| Tổng số Use Case | 62 (UC01 – UC62) |
| Use Case có `<<include>>` | 4 |
| Use Case có `<<extend>>` | 9 |
| Module | 8 |
| Giảm so với v2.0 | 105 → 62 UC (giảm 41%) |

---

## 6. MỐI QUAN HỆ `<<INCLUDE>>` VÀ `<<EXTEND>>` TỔNG HỢP

### `<<include>>` (bắt buộc phải thực hiện)

| Use Case gốc | Include | Mô tả |
|-------------|---------|-------|
| UC17 Mua khóa học | UC18 Thanh toán VNPay/MoMo | Mua hàng bắt buộc phải qua cổng thanh toán — không thể hoàn tất đơn mà không trả tiền |
| UC17 Mua khóa học | UC21 Nhận hóa đơn email | Thanh toán xong luôn gửi hóa đơn email — yêu cầu pháp lý và trải nghiệm người dùng |
| UC19 Mua KH cho con | UC18 Thanh toán VNPay/MoMo | Phụ huynh mua hộ cũng phải qua cổng thanh toán — cùng luồng với UC17 |
| UC44 Quản lý bài giảng | UC43 Quản lý khóa học | Bài giảng luôn thuộc một khóa học — không thể thêm bài giảng khi chưa có khóa học |

### `<<extend>>` (có thể xảy ra, tùy điều kiện)

| Use Case gốc | Extend | Điều kiện |
|-------------|--------|-----------|
| UC08 Danh sách KH | UC09 Tìm kiếm & Lọc | Khi actor nhập từ khóa hoặc chọn bộ lọc danh mục / giá / cấp lớp |
| UC08 Danh sách KH | UC10 Xem danh mục | Khi actor chọn tab danh mục cụ thể từ CategoryGrid |
| UC11 Chi tiết KH | UC12 Bài học thử | Khi bài học có flag isFree = true |
| UC11 Chi tiết KH | UC13 Xem đánh giá | Khi trang chi tiết scroll đến phần review |
| UC22 Yêu cầu hoàn tiền | UC59 Admin xử lý hoàn tiền | Khi Admin phê duyệt yêu cầu hoàn tiền của học sinh |
| UC27 Làm quiz | UC34 AI tạo quiz | Khi bật chế độ "AI Quiz" trong cài đặt khóa học |
| UC28 Xem điểm & Kết quả | UC35 AI phân tích & Đề xuất | Khi AI phát hiện điểm yếu và đề xuất lộ trình cải thiện |
| UC29 Tiến độ & Chứng chỉ | UC35 AI phân tích & Đề xuất | Khi AI phân tích tiến độ tổng thể và có đề xuất phù hợp |
| UC31 Gửi câu hỏi | UC50 Trả lời câu hỏi & Thông báo | Khi GV trả lời, hệ thống thông báo đến học sinh |

---

*Tài liệu này tuân theo chuẩn UML 2.x Use Case Specification.*
*Cập nhật lần cuối: 17/05/2026 — Bee Academy v3.0 (62 UC)*
