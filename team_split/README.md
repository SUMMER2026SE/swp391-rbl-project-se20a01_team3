# team_split — Chia code theo thành viên (Bee Academy)

Mỗi thư mục con là phần code **một thành viên phụ trách**, đã sao chép từ repo gốc và **giữ nguyên cấu trúc
đường dẫn** (`backend/...`, `frontend/...`). Thành viên tải thư mục của mình về, code, rồi push lên repo chính.

| Thư mục | Thành viên | Cụm phụ trách |
|---|---|---|
| `TV1_ThanhDat/` | Thành Đạt | Auth, Tài khoản, Thanh toán/Doanh thu, Bank, Payout, hạ tầng dùng chung |
| `TV2_HaMy/` | Hà My | Khám phá khóa học + Học tập cốt lõi + Đánh giá + Chứng chỉ |
| `TV3_ThuyTien/` | Thủy Tiên | Quiz/Exam + Bài tập/Chấm + Tiến độ + Q&A (+AI) |
| `TV4_DaiThanh/` | Đại Thành | Giáo viên (tạo khóa/nội dung/QB/exam) + Phụ huynh |
| `TV5_MyTam/` | Mỹ Tâm | Admin (dashboard/user/duyệt) + Khiếu nại |

## Cách dùng (quan trọng)

1. Mỗi thư mục **giữ đúng đường dẫn gốc** → khi push, đặt file về đúng vị trí trong repo
   (`backend/src/main/java/...`, `frontend/src/...`).
2. **Đây là gói sở hữu để code song song, KHÔNG phải project chạy độc lập** — backend là một Maven project
   duy nhất, frontend là một Vite project duy nhất. Đừng cố `mvn`/`npm run` bên trong thư mục con.
3. **DTO (`dto/request`, `dto/response`), `config/`, `application.yml`, `App.tsx`, `pom.xml`, `package.json`**
   là **file dùng chung** → **không tách**, vẫn nằm ở repo chính. Cần thêm DTO/route/cột DB thì báo TV1
   (người giữ hạ tầng) để gộp một lần, tránh xung đột.
4. Quy trình git: tạo branch theo UC (`feature/uc16-nop-bai-tap`), commit nhỏ, mở PR, TV1 review & merge.
5. Đọc `NHIEM_VU.md` trong thư mục của mình để biết UC phụ trách + file cần tạo mới + việc còn phải code.

## Lưu ý

- File `*.java`/`*.tsx` trong thư mục con là **bản sao tại thời điểm chia**. Nguồn sự thật vẫn là repo chính —
  sau khi chia, mọi người làm trực tiếp trên branch của repo, không chỉnh sửa rời rạc trong `team_split/`.
- Một số UC ("khiếu nại", "payout") thực tế **đã được dựng một phần** trong code (Complaint*, Payout*) —
  kiểm tra file có sẵn trước khi viết mới.
