-- ============================================================
--  BEE ACADEMY — Full Database Script
--  Version  : 1.2
--  Database : PostgreSQL 15+
--  Created  : 2026-05-18
--  Author   : BEE ACADEMY Team
--
--  26 Tables | 7 Enums | 50 Use Cases covered
-- ============================================================

-- Xóa schema cũ nếu muốn reset toàn bộ (bỏ comment dòng dưới)
-- DROP SCHEMA public CASCADE; CREATE SCHEMA public;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ============================================================
--  ENUMS
-- ============================================================

-- Vai trò người dùng
CREATE TYPE "Role" AS ENUM (
  'STUDENT',   -- Học sinh
  'PARENT',    -- Phụ huynh
  'TEACHER',   -- Giáo viên
  'ADMIN'      -- Quản trị viên (kiêm kế toán)
);

-- Trạng thái đơn hàng
CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',    -- Chờ thanh toán
  'COMPLETED',  -- Đã thanh toán
  'CANCELLED',  -- Đã huỷ
  'REFUNDED'    -- Đã hoàn tiền
);

-- Phương thức thanh toán
CREATE TYPE "PayMethod" AS ENUM (
  'VNPAY',
  'MOMO'
);

-- Trạng thái yêu cầu hoàn tiền
CREATE TYPE "RefundStatus" AS ENUM (
  'PENDING',   -- Chờ duyệt
  'APPROVED',  -- Đã duyệt
  'REJECTED'   -- Từ chối
);

-- Trạng thái chấm công giáo viên
CREATE TYPE "AttendStatus" AS ENUM (
  'PENDING',   -- Chờ duyệt
  'APPROVED',  -- Đã duyệt
  'ADJUSTED'   -- Đã điều chỉnh
);

-- Trạng thái điểm danh học sinh
CREATE TYPE "StudAttStatus" AS ENUM (
  'PRESENT',  -- Có mặt
  'ABSENT',   -- Vắng
  'LATE'      -- Trễ
);

-- Trạng thái bảng lương
CREATE TYPE "SalaryStatus" AS ENUM (
  'DRAFT',    -- Nháp
  'APPROVED', -- Đã duyệt
  'PAID'      -- Đã chi trả
);

-- ============================================================
--  NHÓM 1 — NGƯỜI DÙNG & XÁC THỰC
-- ============================================================

-- Bảng 01: User — Tất cả tài khoản hệ thống
-- UC: UC01–UC05, UC40
CREATE TABLE "User" (
  "id"           TEXT         NOT NULL,
  "email"        TEXT         NOT NULL,
  "passwordHash" TEXT         NOT NULL,
  "name"         TEXT         NOT NULL,
  "avatar"       TEXT,                           -- URL Cloudinary (null = dùng initials)
  "role"         "Role"       NOT NULL,
  "isActive"     BOOLEAN      NOT NULL DEFAULT true,
  "isVerified"   BOOLEAN      NOT NULL DEFAULT false,
  "hourlyRate"   INTEGER,                        -- Chỉ dùng cho TEACHER (VND/giờ)
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Bảng 02: PasswordResetToken — Token đặt lại mật khẩu
-- UC: UC04
CREATE TABLE "PasswordResetToken" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "token"     TEXT         NOT NULL,  -- UUID ngẫu nhiên, xóa sau khi dùng
  "expiresAt" TIMESTAMP(3) NOT NULL,  -- Hết hạn sau 1 giờ
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- Bảng 03: ParentStudent — Quan hệ Phụ huynh <-> Học sinh (M:N)
-- UC: UC26–UC30
CREATE TABLE "ParentStudent" (
  "parentId"  TEXT NOT NULL,
  "studentId" TEXT NOT NULL,

  CONSTRAINT "ParentStudent_pkey" PRIMARY KEY ("parentId", "studentId")
);

-- ============================================================
--  NHÓM 2 — KHÓA HỌC & NỘI DUNG
-- ============================================================

-- Bảng 04: Category — Danh mục khóa học
-- UC: UC41, UC06, UC07
CREATE TABLE "Category" (
  "id"   TEXT NOT NULL,
  "slug" TEXT NOT NULL,  -- toan-hoc, tieng-anh, ...
  "name" TEXT NOT NULL,  -- Toán học, Tiếng Anh, ...
  "icon" TEXT,           -- Emoji hoặc URL icon

  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- Bảng 05: Course — Khóa học (bảng trung tâm)
-- UC: UC06–UC09, UC14, UC42
CREATE TABLE "Course" (
  "id"          TEXT         NOT NULL,
  "slug"        TEXT         NOT NULL,
  "title"       TEXT         NOT NULL,
  "description" TEXT         NOT NULL,
  "thumbnail"   TEXT         NOT NULL,  -- Cloudinary URL
  "price"       INTEGER      NOT NULL,  -- VND, số nguyên (vd: 299000)
  "salePrice"   INTEGER,                -- null = không giảm giá
  "categoryId"  TEXT         NOT NULL,
  "grade"       INTEGER[]    NOT NULL DEFAULT '{}',  -- [6,7,8,9]
  "isPublished" BOOLEAN      NOT NULL DEFAULT false,
  "isFeatured"  BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- Bảng 06: CourseTeacher — Phân công giáo viên dạy khóa học (M:N)
-- UC: UC42, UC32
CREATE TABLE "CourseTeacher" (
  "courseId"   TEXT         NOT NULL,
  "teacherId"  TEXT         NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CourseTeacher_pkey" PRIMARY KEY ("courseId", "teacherId")
);

-- Bảng 07: Lesson — Bài giảng / Video
-- UC: UC32, UC09 (isFree), UC15, UC16
CREATE TABLE "Lesson" (
  "id"          TEXT    NOT NULL,
  "courseId"    TEXT    NOT NULL,
  "title"       TEXT    NOT NULL,
  "videoUrl"    TEXT,             -- Cloudinary video URL
  "materialUrl" TEXT,             -- URL tài liệu đính kèm (PDF, ...)
  "duration"    INTEGER NOT NULL, -- Thời lượng (giây)
  "order"       INTEGER NOT NULL, -- Thứ tự trong khóa học
  "isFree"      BOOLEAN NOT NULL DEFAULT false,  -- Bài học thử miễn phí

  CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- ============================================================
--  NHÓM 3 — HỌC TẬP & TIẾN ĐỘ
-- ============================================================

-- Bảng 08: Enrollment — Quyền truy cập khóa học sau khi mua
-- UC: UC11, UC14, UC19
CREATE TABLE "Enrollment" (
  "id"       TEXT         NOT NULL,
  "userId"   TEXT         NOT NULL,
  "courseId" TEXT         NOT NULL,
  "progress" INTEGER      NOT NULL DEFAULT 0,  -- % hoàn thành (0–100)
  "paidAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- Bảng 09: LessonProgress — Theo dõi từng bài đã xem
-- UC: UC15, UC19, UC25, UC36
CREATE TABLE "LessonProgress" (
  "id"           TEXT         NOT NULL,
  "enrollmentId" TEXT         NOT NULL,
  "lessonId"     TEXT         NOT NULL,
  "completed"    BOOLEAN      NOT NULL DEFAULT false,
  "watchedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- Bảng 10: Quiz — Bộ đề trắc nghiệm
-- UC: UC33, UC18, UC24 (AI sinh quiz)
CREATE TABLE "Quiz" (
  "id"           TEXT    NOT NULL,
  "courseId"     TEXT    NOT NULL,
  "title"        TEXT    NOT NULL,
  "timeLimit"    INTEGER NOT NULL,  -- Giới hạn thời gian (giây)
  "passingScore" INTEGER NOT NULL,  -- Điểm đạt (0–100)
  "isActive"     BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- Bảng 11: Question — Câu hỏi trắc nghiệm
-- UC: UC33, UC18
-- options: [{"key":"A","text":"..."},{"key":"B","text":"..."},...]
CREATE TABLE "Question" (
  "id"            TEXT    NOT NULL,
  "quizId"        TEXT    NOT NULL,
  "text"          TEXT    NOT NULL,
  "options"       JSONB   NOT NULL,   -- Mảng 4 đáp án dạng JSON
  "correctAnswer" TEXT    NOT NULL,   -- "A", "B", "C" hoặc "D"
  "explanation"   TEXT,               -- Giải thích đáp án đúng
  "order"         INTEGER NOT NULL,

  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- Bảng 12: QuizAttempt — Kết quả mỗi lần làm bài
-- UC: UC18, UC19, UC36
CREATE TABLE "QuizAttempt" (
  "id"          TEXT         NOT NULL,
  "userId"      TEXT         NOT NULL,
  "quizId"      TEXT         NOT NULL,
  "answers"     JSONB        NOT NULL,  -- {"Q1":"A","Q2":"C",...}
  "score"       INTEGER      NOT NULL,  -- Điểm (0–100)
  "passed"      BOOLEAN      NOT NULL,
  "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),

  CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- Bảng 13: Assignment — Bài tập tự luận
-- UC: UC33, UC17
CREATE TABLE "Assignment" (
  "id"          TEXT         NOT NULL,
  "courseId"    TEXT         NOT NULL,
  "title"       TEXT         NOT NULL,
  "description" TEXT         NOT NULL,
  "dueDate"     TIMESTAMP(3),           -- null = không có hạn nộp
  "maxScore"    INTEGER      NOT NULL DEFAULT 100,

  CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- Bảng 14: AssignmentSubmission — Bài nộp của học sinh
-- UC: UC17, UC34, UC19
CREATE TABLE "AssignmentSubmission" (
  "id"           TEXT         NOT NULL,
  "assignmentId" TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "fileUrl"      TEXT,                    -- URL file đính kèm (Cloudinary)
  "textAnswer"   TEXT,                    -- Bài làm dạng text
  "grade"        INTEGER,                 -- Điểm giáo viên chấm (null = chưa chấm)
  "feedback"     TEXT,                    -- Nhận xét của giáo viên
  "submittedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- Bảng 15: Review — Đánh giá sao và nhận xét khóa học
-- UC: UC20, UC08
CREATE TABLE "Review" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "courseId"  TEXT         NOT NULL,
  "rating"    INTEGER      NOT NULL,  -- 1–5 sao
  "comment"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- ============================================================
--  NHÓM 4 — GIỎ HÀNG & THANH TOÁN
-- ============================================================

-- Bảng 16: Cart — Giỏ hàng tạm (mỗi user 1 giỏ)
-- UC: UC10
CREATE TABLE "Cart" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,  -- UNIQUE: 1 user 1 giỏ
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- Bảng 17: CartItem — Từng khóa học trong giỏ
-- UC: UC10
CREATE TABLE "CartItem" (
  "id"       TEXT         NOT NULL,
  "cartId"   TEXT         NOT NULL,
  "courseId" TEXT         NOT NULL,
  "addedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- Bảng 18: Order — Đơn hàng
-- UC: UC11, UC12, UC44, UC45
CREATE TABLE "Order" (
  "id"            TEXT          NOT NULL,
  "userId"        TEXT          NOT NULL,
  "status"        "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "totalAmount"   INTEGER       NOT NULL,  -- VND
  "paymentMethod" "PayMethod"   NOT NULL,
  "paymentRef"    TEXT,                    -- Mã giao dịch VNPay/MoMo
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt"        TIMESTAMP(3),            -- null = chưa thanh toán

  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- Bảng 19: OrderItem — Chi tiết khóa học trong đơn
-- UC: UC11, UC12
CREATE TABLE "OrderItem" (
  "id"       TEXT    NOT NULL,
  "orderId"  TEXT    NOT NULL,
  "courseId" TEXT    NOT NULL,
  "price"    INTEGER NOT NULL,  -- Snapshot giá tại thời điểm mua

  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- Bảng 20: RefundRequest — Yêu cầu hoàn tiền
-- UC: UC13, UC44
CREATE TABLE "RefundRequest" (
  "id"          TEXT           NOT NULL,
  "orderId"     TEXT           NOT NULL,  -- UNIQUE: 1 đơn tối đa 1 yêu cầu
  "userId"      TEXT           NOT NULL,
  "reason"      TEXT           NOT NULL,
  "status"      "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "adminNote"   TEXT,
  "requestedAt" TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt"  TIMESTAMP(3),

  CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

-- ============================================================
--  NHÓM 5 — LỊCH HỌC & TƯƠNG TÁC
-- ============================================================

-- Bảng 21: Schedule — Lịch dạy trực tuyến
-- UC: UC43, UC38, UC22, UC27
CREATE TABLE "Schedule" (
  "id"         TEXT         NOT NULL,
  "courseId"   TEXT         NOT NULL,
  "teacherId"  TEXT         NOT NULL,
  "startTime"  TIMESTAMP(3) NOT NULL,
  "endTime"    TIMESTAMP(3) NOT NULL,
  "meetingUrl" TEXT,                   -- Link Zoom/Meet/Teams
  "note"       TEXT,

  CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- Bảng 22: Message — Tin nhắn giữa học sinh <-> giáo viên, phụ huynh <-> giáo viên
-- UC: UC21, UC37, UC29
CREATE TABLE "Message" (
  "id"         TEXT         NOT NULL,
  "senderId"   TEXT         NOT NULL,
  "receiverId" TEXT         NOT NULL,
  "courseId"   TEXT,                   -- null = tin nhắn ngoài khóa học
  "content"    TEXT         NOT NULL,
  "isRead"     BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- Bảng 23: Notification — Thông báo hệ thống -> user
-- UC: UC46, UC22, UC29
CREATE TABLE "Notification" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "title"     TEXT         NOT NULL,
  "body"      TEXT         NOT NULL,
  "type"      TEXT         NOT NULL,  -- "SCHEDULE","PAYMENT","GRADE","SYSTEM",...
  "isRead"    BOOLEAN      NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- ============================================================
--  NHÓM 6 — CHẤM CÔNG & LƯƠNG
-- ============================================================

-- Bảng 24: Attendance — Chấm công giáo viên (check-in / check-out)
-- UC: UC38, UC48
CREATE TABLE "Attendance" (
  "id"         TEXT             NOT NULL,
  "teacherId"  TEXT             NOT NULL,
  "scheduleId" TEXT,                       -- null = chấm công ngoài lịch
  "checkIn"    TIMESTAMP(3)     NOT NULL,
  "checkOut"   TIMESTAMP(3),
  "totalHours" DOUBLE PRECISION,           -- Tính sau khi check-out
  "status"     "AttendStatus"   NOT NULL DEFAULT 'PENDING',
  "adminNote"  TEXT,
  "createdAt"  TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- Bảng 25: StudentAttendance — Điểm danh học sinh từng buổi học
-- UC: UC35, UC28
CREATE TABLE "StudentAttendance" (
  "id"         TEXT            NOT NULL,
  "scheduleId" TEXT            NOT NULL,
  "studentId"  TEXT            NOT NULL,
  "status"     "StudAttStatus" NOT NULL DEFAULT 'PRESENT',
  "note"       TEXT,
  "markedAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);

-- Bảng 26: Salary — Bảng lương tháng của giáo viên
-- UC: UC49, UC50
CREATE TABLE "Salary" (
  "id"          TEXT             NOT NULL,
  "teacherId"   TEXT             NOT NULL,
  "month"       INTEGER          NOT NULL,  -- 1–12
  "year"        INTEGER          NOT NULL,
  "totalHours"  DOUBLE PRECISION NOT NULL,
  "hourlyRate"  INTEGER          NOT NULL,  -- Snapshot lương/giờ tại thời điểm tính
  "totalAmount" INTEGER          NOT NULL,  -- VND = totalHours * hourlyRate
  "status"      "SalaryStatus"   NOT NULL DEFAULT 'DRAFT',
  "paidAt"      TIMESTAMP(3),

  CONSTRAINT "Salary_pkey" PRIMARY KEY ("id")
);

-- ============================================================
--  UNIQUE INDEXES
-- ============================================================

CREATE UNIQUE INDEX "User_email_key"                            ON "User"("email");
CREATE UNIQUE INDEX "PasswordResetToken_token_key"             ON "PasswordResetToken"("token");
CREATE UNIQUE INDEX "Category_slug_key"                        ON "Category"("slug");
CREATE UNIQUE INDEX "Course_slug_key"                          ON "Course"("slug");
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key"           ON "Enrollment"("userId", "courseId");
CREATE UNIQUE INDEX "LessonProgress_enrollmentId_lessonId_key" ON "LessonProgress"("enrollmentId", "lessonId");
CREATE UNIQUE INDEX "Review_userId_courseId_key"               ON "Review"("userId", "courseId");
CREATE UNIQUE INDEX "Cart_userId_key"                          ON "Cart"("userId");
CREATE UNIQUE INDEX "CartItem_cartId_courseId_key"             ON "CartItem"("cartId", "courseId");
CREATE UNIQUE INDEX "RefundRequest_orderId_key"                ON "RefundRequest"("orderId");
CREATE UNIQUE INDEX "StudentAttendance_scheduleId_studentId_key" ON "StudentAttendance"("scheduleId", "studentId");
CREATE UNIQUE INDEX "Salary_teacherId_month_year_key"          ON "Salary"("teacherId", "month", "year");

-- ============================================================
--  PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX "Course_categoryId_idx"           ON "Course"("categoryId");
CREATE INDEX "Course_isPublished_idx"          ON "Course"("isPublished");
CREATE INDEX "Course_isFeatured_idx"           ON "Course"("isFeatured");
CREATE INDEX "Lesson_courseId_order_idx"       ON "Lesson"("courseId", "order");
CREATE INDEX "Order_userId_idx"                ON "Order"("userId");
CREATE INDEX "Order_status_idx"                ON "Order"("status");
CREATE INDEX "Message_senderId_idx"            ON "Message"("senderId");
CREATE INDEX "Message_receiverId_idx"          ON "Message"("receiverId");
CREATE INDEX "Notification_userId_isRead_idx"  ON "Notification"("userId", "isRead");
CREATE INDEX "Attendance_teacherId_idx"        ON "Attendance"("teacherId");
CREATE INDEX "Schedule_courseId_idx"           ON "Schedule"("courseId");
CREATE INDEX "Schedule_teacherId_idx"          ON "Schedule"("teacherId");

-- ============================================================
--  FOREIGN KEYS
-- ============================================================

-- PasswordResetToken -> User (CASCADE: xóa user xóa token luôn)
ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ParentStudent -> User
ALTER TABLE "ParentStudent"
  ADD CONSTRAINT "ParentStudent_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ParentStudent"
  ADD CONSTRAINT "ParentStudent_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Course -> Category
ALTER TABLE "Course"
  ADD CONSTRAINT "Course_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CourseTeacher -> Course, User
ALTER TABLE "CourseTeacher"
  ADD CONSTRAINT "CourseTeacher_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CourseTeacher"
  ADD CONSTRAINT "CourseTeacher_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Lesson -> Course
ALTER TABLE "Lesson"
  ADD CONSTRAINT "Lesson_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enrollment -> User, Course
ALTER TABLE "Enrollment"
  ADD CONSTRAINT "Enrollment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Enrollment"
  ADD CONSTRAINT "Enrollment_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- LessonProgress -> Enrollment, Lesson
ALTER TABLE "LessonProgress"
  ADD CONSTRAINT "LessonProgress_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LessonProgress"
  ADD CONSTRAINT "LessonProgress_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Quiz -> Course
ALTER TABLE "Quiz"
  ADD CONSTRAINT "Quiz_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Question -> Quiz
ALTER TABLE "Question"
  ADD CONSTRAINT "Question_quizId_fkey"
  FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- QuizAttempt -> User, Quiz
ALTER TABLE "QuizAttempt"
  ADD CONSTRAINT "QuizAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuizAttempt"
  ADD CONSTRAINT "QuizAttempt_quizId_fkey"
  FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Assignment -> Course
ALTER TABLE "Assignment"
  ADD CONSTRAINT "Assignment_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AssignmentSubmission -> Assignment, User
ALTER TABLE "AssignmentSubmission"
  ADD CONSTRAINT "AssignmentSubmission_assignmentId_fkey"
  FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssignmentSubmission"
  ADD CONSTRAINT "AssignmentSubmission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Review -> User, Course
ALTER TABLE "Review"
  ADD CONSTRAINT "Review_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review"
  ADD CONSTRAINT "Review_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Cart -> User
ALTER TABLE "Cart"
  ADD CONSTRAINT "Cart_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CartItem -> Cart, Course
ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_cartId_fkey"
  FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Order -> User
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- OrderItem -> Order, Course
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RefundRequest -> Order, User
ALTER TABLE "RefundRequest"
  ADD CONSTRAINT "RefundRequest_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RefundRequest"
  ADD CONSTRAINT "RefundRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Schedule -> Course, User(teacher)
ALTER TABLE "Schedule"
  ADD CONSTRAINT "Schedule_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Schedule"
  ADD CONSTRAINT "Schedule_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Attendance -> User(teacher), Schedule
ALTER TABLE "Attendance"
  ADD CONSTRAINT "Attendance_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance"
  ADD CONSTRAINT "Attendance_scheduleId_fkey"
  FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- StudentAttendance -> Schedule, User(student)
ALTER TABLE "StudentAttendance"
  ADD CONSTRAINT "StudentAttendance_scheduleId_fkey"
  FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentAttendance"
  ADD CONSTRAINT "StudentAttendance_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Salary -> User(teacher)
ALTER TABLE "Salary"
  ADD CONSTRAINT "Salary_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Message -> User(sender), User(receiver), Course
ALTER TABLE "Message"
  ADD CONSTRAINT "Message_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message"
  ADD CONSTRAINT "Message_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message"
  ADD CONSTRAINT "Message_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Notification -> User
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
--  CHECK CONSTRAINTS
-- ============================================================

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_check"
  CHECK ("rating" >= 1 AND "rating" <= 5);

ALTER TABLE "Enrollment"
  ADD CONSTRAINT "Enrollment_progress_check"
  CHECK ("progress" >= 0 AND "progress" <= 100);

ALTER TABLE "Course"
  ADD CONSTRAINT "Course_price_check"
  CHECK ("price" >= 0);

ALTER TABLE "Salary"
  ADD CONSTRAINT "Salary_month_check"
  CHECK ("month" >= 1 AND "month" <= 12);

ALTER TABLE "Salary"
  ADD CONSTRAINT "Salary_year_check"
  CHECK ("year" >= 2024);

-- ============================================================
--  SEED DATA — DỮ LIỆU KHỞI TẠO
-- ============================================================

-- 8 Danh mục khóa học
INSERT INTO "Category" ("id", "slug", "name", "icon") VALUES
  (gen_random_uuid()::text, 'toan-hoc',    'Toan hoc',              '📐'),
  (gen_random_uuid()::text, 'tieng-anh',   'Tieng Anh',             '🇬🇧'),
  (gen_random_uuid()::text, 'ngu-van',     'Ngu van',               '📖'),
  (gen_random_uuid()::text, 'khoa-hoc',    'Khoa hoc tu nhien',     '🔬'),
  (gen_random_uuid()::text, 'lich-su',     'Lich su & Dia ly',      '🌏'),
  (gen_random_uuid()::text, 'tin-hoc',     'Tin hoc',               '💻'),
  (gen_random_uuid()::text, 'on-thi-10',   'On thi vao lop 10',     '🏆'),
  (gen_random_uuid()::text, 'ky-nang-mem', 'Ky nang mem',           '🌟')
ON CONFLICT ("slug") DO NOTHING;

-- 3 Tài khoản mẫu
-- Lưu ý: passwordHash dưới đây là placeholder.
-- Dùng npx prisma db seed để seed với bcrypt hash thực.
--
--   Admin   : admin@beeacademy.vn   / Admin@123
--   Teacher : giaovien@beeacademy.vn / Teacher@123
--   Student : hocsinh@beeacademy.vn  / Student@123

-- ============================================================
--  SUMMARY
-- ============================================================
--
--  ENUMs   : 7   (Role, OrderStatus, PayMethod, RefundStatus,
--                  AttendStatus, StudAttStatus, SalaryStatus)
--  Tables  : 26
--    Nhom 1 — Nguoi dung & Xac thuc   : 3 bang
--    Nhom 2 — Khoa hoc & Noi dung     : 4 bang
--    Nhom 3 — Hoc tap & Tien do       : 8 bang
--    Nhom 4 — Gio hang & Thanh toan   : 5 bang
--    Nhom 5 — Lich hoc & Tuong tac    : 3 bang
--    Nhom 6 — Cham cong & Luong       : 3 bang
--  Indexes : 12 UNIQUE + 12 PERFORMANCE
--  FK      : 32 foreign key constraints
--  Check   : 5  check constraints
--  Use Cases covered: UC01–UC50 (50/50)
--
-- ============================================================
