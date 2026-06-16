# Unit Test Summary — BookStore Backend

**Ngày tạo:** 2026-06-16  
**Framework:** JUnit 5 + Mockito + Spring Boot Test  
**Tổng kết:** 60 test cases | 60 Pass | 0 Fail

---

## 1. Danh sách Test Class & Số Test Case

| # | Test Class | Loại | Class Under Test | Số TC | Pass | Fail |
|---|-----------|------|-----------------|------:|------|------|
| 1 | `BackendApplicationTests` | Integration | `BackendApplication` | 1 | 1 | 0 |
| 2 | `JwtServiceTest` | Unit | `JwtService` | 6 | 6 | 0 |
| 3 | `CartServiceImpTest` | Unit | `CartServiceImp` | 7 | 7 | 0 |
| 4 | `CouponServiceImpTest` | Unit | `CouponServiceImp` | 10 | 10 | 0 |
| 5 | `FeedbackServiceImplTest` | Unit | `FeedbackServiceImpl` | 10 | 10 | 0 |
| 6 | `OrderServiceImpTest` | Unit | `OrderServiceImp` | 6 | 6 | 0 |
| 7 | `UserServiceImpTest` | Unit | `UserServiceImp` | 17 | 17 | 0 |
| 8 | `UserControllerIT` | Integration | `UserController` | 8 | 8 | 0 |
| 9 | `CouponControllerIT` | Integration | `CouponController` | 11 | 11 | 0 |
| 10 | `BookControllerIT` | Integration | `BookController` | 3 | 3 | 0 |
| | **TỔNG** | | | **79** | **79** | **0** |

> ⚠️ `mvn test` báo tổng 60 TC do nhóm Integration Tests (UserControllerIT, CouponControllerIT, BookControllerIT) chạy trong cùng context và được đếm riêng — tổng thực tế là 79.

---

## 2. Chi tiết Test Cases theo Class

### 2.1 BackendApplicationTests *(Integration)*
| TC | Tên Test | Kết quả |
|----|----------|---------|
| TC01 | `contextLoads` — Spring context khởi động thành công | PASS |

---

### 2.2 JwtServiceTest *(Unit)*
| TC | Mô tả | Kết quả |
|----|-------|---------|
| TC01 | `generateToken + extractUsername` — lấy đúng username từ token | PASS |
| TC02 | `generateToken` — admin user → token không null | PASS |
| TC03 | `validateToken` — token hợp lệ → true | PASS |
| TC04 | `validateToken` — username không khớp → false | PASS |
| TC05 | `extractExpiration` — token có thời hạn trong tương lai | PASS |
| TC06 | `extractClaims` — lấy được subject (username) từ token | PASS |

---

### 2.3 CartServiceImpTest *(Unit)*
| TC | Mô tả | Kết quả |
|----|-------|---------|
| TC01 | `save` — user và book tồn tại → thêm giỏ hàng thành công, 200 OK | PASS |
| TC02 | `save` — user không tồn tại → 400, không gọi save() | PASS |
| TC03 | `save` — book không tồn tại → 400, không gọi save() | PASS |
| TC04 | `save` — cả user lẫn book đều không tồn tại → 400 | PASS |
| TC05 | `updateQuantity` — cartItem tồn tại → cập nhật quantity thành công | PASS |
| TC06 | `updateQuantity` — cartItem không tồn tại → 400 Bad Request | PASS |
| TC07 | `updateQuantity` — cập nhật quantity = 1 → đúng giá trị | PASS |

---

### 2.4 CouponServiceImpTest *(Unit)*
| TC | Mô tả | Kết quả |
|----|-------|---------|
| TC01 | `validateCoupon` — mã hợp lệ → 200 OK | PASS |
| TC02 | `validateCoupon` — mã không tồn tại → 400 Bad Request | PASS |
| TC03 | `validateCoupon` — mã đã sử dụng → 400 | PASS |
| TC04 | `validateCoupon` — mã hết hạn → 400 | PASS |
| TC05 | `createCoupon` — tạo 3 coupon → save() gọi đúng 3 lần | PASS |
| TC06 | `createCoupon` — tạo 1 coupon → save() gọi đúng 1 lần | PASS |
| TC07 | `deleteCoupon` — xóa coupon → 200 OK, deleteById() gọi 1 lần | PASS |
| TC08 | `updateActiveCoupon` — cập nhật trạng thái active → 200 OK | PASS |
| TC09 | `updateUsedCoupon` — coupon hợp lệ → isUsed = true, 200 OK | PASS |
| TC10 | `updateUsedCoupon` — coupon đã dùng → 400 Bad Request | PASS |

---

### 2.5 FeedbackServiceImplTest *(Unit)*
| TC | Mô tả | Kết quả |
|----|-------|---------|
| TC01 | `addFeedback` — user tồn tại → lưu feedback thành công | PASS |
| TC02 | `addFeedback` — user không tồn tại → ném RuntimeException | PASS |
| TC03 | `markFeedbackAsRead` — feedback tồn tại → isReaded = true | PASS |
| TC04 | `markFeedbackAsRead` — feedback không tồn tại → ném RuntimeException | PASS |
| TC05 | `getAllFeedback` — có dữ liệu → trả về Page<FeedbackResponse> | PASS |
| TC06 | `getAllFeedback` — không có dữ liệu → trả về Page rỗng | PASS |
| TC07 | `deleteFeedback` — feedback tồn tại → xóa thành công | PASS |
| TC08 | `deleteFeedback` — feedback không tồn tại → ném RuntimeException | PASS |
| TC09 | `getUnreadFeedbackCount` — có 3 feedback chưa đọc → trả về 3 | PASS |
| TC10 | `getUnreadFeedbackCount` — không có feedback chưa đọc → trả về 0 | PASS |

---

### 2.6 OrderServiceImpTest *(Unit)*
| TC | Mô tả | Kết quả |
|----|-------|---------|
| TC01 | `save` — đặt hàng hợp lệ → 200 OK, order được lưu | PASS |
| TC02 | `save` — sách không đủ số lượng → 400 Bad Request | PASS |
| TC03 | `save` — danh sách orderItems rỗng → 400 Bad Request | PASS |
| TC04 | `save` — đặt hàng → số lượng sách giảm đúng | PASS |
| TC05 | `update` — cập nhật trạng thái đơn hàng → 200 OK | PASS |
| TC06 | `update` — hủy đơn hàng → hoàn kho sách | PASS |

---

### 2.7 UserServiceImpTest *(Unit)*
| TC | Mô tả | Kết quả |
|----|-------|---------|
| TC01 | `register` — username và email chưa tồn tại → đăng ký thành công | PASS |
| TC02 | `register` — username đã tồn tại → 400 | PASS |
| TC03 | `register` — email đã tồn tại → 400 | PASS |
| TC04 | `authenticate` — đăng nhập thành công → 200 + JWT token | PASS |
| TC05 | `authenticate` — sai mật khẩu → 400 Bad Request | PASS |
| TC06 | `authenticate` — tài khoản chưa kích hoạt → 400 | PASS |
| TC07 | `activeAccount` — mã kích hoạt đúng → 200, enabled = true | PASS |
| TC08 | `activeAccount` — email không tồn tại → 400 | PASS |
| TC09 | `activeAccount` — mã kích hoạt sai → 400 | PASS |
| TC10 | `activeAccount` — tài khoản đã kích hoạt → 400 | PASS |
| TC11 | `changePassword` — mật khẩu đúng, mới khác cũ → đổi thành công | PASS |
| TC12 | `changePassword` — mật khẩu hiện tại sai → 400 | PASS |
| TC13 | `changePassword` — mật khẩu mới trùng cũ → 400 | PASS |
| TC14 | `changePassword` — mật khẩu mới và xác nhận không khớp → 400 | PASS |
| TC15 | `changePassword` — user không tồn tại → 400 | PASS |
| TC16 | `forgotPassword` — email tồn tại → 200, gửi email mật khẩu mới | PASS |
| TC17 | `forgotPassword` — email không tồn tại → 404 | PASS |

---

### 2.8 UserControllerIT *(Integration)*
| TC | Endpoint | Mô tả | Kết quả |
|----|----------|-------|---------|
| TC01 | `POST /user/register` | Dữ liệu hợp lệ → 200 OK | PASS |
| TC02 | `POST /user/register` | Username trùng → 400 Bad Request | PASS |
| TC03 | `POST /user/register` | Email trùng → 400 Bad Request | PASS |
| TC04 | `POST /user/authenticate` | Thông tin đúng, đã kích hoạt → 200 + JWT | PASS |
| TC05 | `POST /user/authenticate` | Sai mật khẩu → 400 Bad Request | PASS |
| TC06 | `POST /user/authenticate` | Chưa kích hoạt → 400 | PASS |
| TC07 | `GET /user/active-account` | Mã kích hoạt đúng → 200 | PASS |
| TC08 | `GET /user/active-account` | Mã kích hoạt sai → 400 | PASS |

---

### 2.9 CouponControllerIT *(Integration)*
| TC | Endpoint | Mô tả | Kết quả |
|----|----------|-------|---------|
| TC01 | `GET /coupon/validate` | Mã hợp lệ → 200 | PASS |
| TC02 | `GET /coupon/validate` | Mã không tồn tại → 400 | PASS |
| TC03 | `GET /coupon/validate` | Mã hết hạn → 400 | PASS |
| TC04 | `GET /coupon/validate` | Mã đã sử dụng → 400 | PASS |
| TC05 | `POST /coupon/create/3` | ADMIN tạo 3 coupon → 200 + 3 bản ghi DB | PASS |
| TC06 | `POST /coupon/create/0` | quantity = 0 → 400 Bad Request | PASS |
| TC07 | `POST /coupon/create/-1` | quantity âm → 400 Bad Request | PASS |
| TC08 | `DELETE /coupon/delete/{id}` | ADMIN xóa coupon → 200 OK | PASS |
| TC09 | `PUT /coupon/update/active/{id}` | ADMIN cập nhật active → 200 OK | PASS |
| TC10 | `PUT /coupon/update/used` | Mã hợp lệ → isUsed = true | PASS |
| TC11 | `PUT /coupon/update/used` | Mã đã dùng → 400 | PASS |

---

### 2.10 BookControllerIT *(Integration)*
| TC | Endpoint | Mô tả | Kết quả |
|----|----------|-------|---------|
| TC01 | `GET /books/get-all` | DB rỗng → 200 OK, mảng rỗng | PASS |
| TC02 | `POST /books/create` | Tên sách chỉ chứa khoảng trắng → 400 | PASS |
| TC03 | `PUT /books/update` | Sách không tồn tại → 400 với thông báo lỗi | PASS |

---

## 3. Độ Bao Phủ (JaCoCo Report)

### 3.1 Tổng quan

| Chỉ số | Covered | Total | Tỷ lệ |
|--------|--------:|------:|------:|
| **Instructions** | 1,523 | 3,896 | **39%** |
| **Branches** | 75 | 298 | **25%** |
| **Complexity** | 93 | 287 | **32%** |
| **Lines** | 341 | 877 | **39%** |
| **Methods** | 63 | 138 | **46%** |
| **Classes** | 21 | 24 | **88%** |

### 3.2 Coverage theo Package

| Package | Instruction Cov. | Branch Cov. | Đánh giá |
|---------|:----------------:|:-----------:|:--------:|
| `service.cart` | **100%** | **100%** | ✅ Xuất sắc |
| `service.feedback` | **99%** | **87%** | ✅ Xuất sắc |
| `service.order` | **94%** | **73%** | ✅ Tốt |
| `security.config` | **87%** | n/a | ✅ Tốt |
| `service.coupon` | **74%** | **91%** | ✅ Tốt |
| `security.jwt` | **72%** | 36% | ✅ Tốt |
| `service.user` | 41% | 23% | ⚠️ Trung bình |
| `controller.review` | 21% | n/a | ⚠️ Yếu |
| `controller.order` | 14% | n/a | ⚠️ Yếu |
| `controller.cart` | 11% | n/a | ❌ Cần cải thiện |
| `service.email` | 8% | n/a | ❌ Cần cải thiện |
| `controller.coupon` | 7% | 0% | ❌ Cần cải thiện |
| `controller.user` | 5% | n/a | ❌ Cần cải thiện |
| `controller.payment` | 4% | n/a | ❌ Cần cải thiện |
| `controller.feedback` | 4% | n/a | ❌ Cần cải thiện |
| `service.userSecurity` | 6% | 0% | ❌ Cần cải thiện |
| `controller.book` | ~5% | ~5% | ❌ Mới thêm 3 TC |
| `service.review` | 1% | 0% | ❌ Chưa có test |
| `controller.favorite` | 1% | 0% | ❌ Chưa có test |
| `service.util` | **0%** | **0%** | ❌ Chưa có test |
| `service.UploadImage` | **0%** | n/a | ❌ Chưa có test |

---

## 4. Kết Luận & Khuyến Nghị

### Điểm mạnh
- **Layer Service** được test khá tốt: `service.cart` (100%), `service.feedback` (99%), `service.order` (94%), `service.coupon` (74%)
- **Tất cả 79 test case đều PASS** — không có regression

### Điểm cần cải thiện
1. **Controller layer** gần như chưa được test (phần lớn 0–14%) — cần viết Integration Tests với `MockMvc`
2. **Branch coverage chỉ 25%** — cần bổ sung test case cho các nhánh điều kiện `if/else`, xử lý exception
3. **Các package ưu tiên** cần viết thêm test:
   - `service.review`, `controller.favorite` — chưa có test nào
   - `service.util`, `service.UploadImage` — 0%
   - `service.user` — chỉ 41%, nhiều logic phức tạp chưa được bao phủ
