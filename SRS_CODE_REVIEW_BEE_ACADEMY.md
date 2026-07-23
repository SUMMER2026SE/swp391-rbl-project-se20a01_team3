# Bao cao review code theo SRS Bee Academy 4.10

Ngay review: 09/07/2026

Nguon doi chieu:

- SRS: `C:\Users\ASUS\Downloads\SRS_Bee_Academy.docx`, phien ban 4.10, ngay ban hanh 08/07/2026.
- Code hien tai: workspace `E:\swp391-rbl-project-se20a01_team3`.
- Pham vi quet: `backend/src/main/java`, `backend/db/migrations`, `frontend/src`, cac file route/API/frontend page, test hien co.

## 1. Ket luan nhanh

He thong Bee Academy hien tai da vuot xa muc "prototype": co backend Spring Boot, frontend React/Vite, Supabase/PostgreSQL, JWT, PayOS, upload storage, course workflow, parent portal, teacher portal, admin dashboard, complaints, quiz/exam, Q&A va revenue/payout.

Tuy nhien, neu cham nghiem ngat theo SRS 4.10 thi nhieu chuc nang moi o ban SRS sau review van chi moi hoan thanh phan loi chinh, chua du state machine, audit log, quy tac nghiep vu va dieu kien chap nhan. Cac khoang thieu lon nhat nam o:

- Teacher onboarding: chua co `teacher_profile_state` va phe duyet ho so giao vien truoc khi truy cap `REQ-TCH-*`.
- Payment state machine: chua co `PaymentAttempt`, `refund_status`, `reconciliation_status`, `PAYMENT_REVIEW`, retry/partial refund dung SRS.
- Certificate: chua co sinh/cham soc vong doi chung chi PDF QR.
- Exam retake/anti-cheat: chua co `ExamEnrollment/RetakeApproval`, fullscreen/tab tracking, autosave 15s, approve mo them luot.
- Admin security: doi role/khoa user chua co 2FA, dual approval, audit log, rule chong tu khoa/chong vo hieu Admin cuoi cung.
- AI chat/AI roadmap: chua co luong chat AI ho tro hoc sinh va de xuat lo trinh ca nhan hoa; hien moi co AI scan PDF cho giao vien.
- NFR: chua co bang chung coverage 70%, load test 5.000 VU, backup/PITR, WCAG audit, security scan.

## 2. Bang tong hop theo module

Quy uoc trang thai:

- Hoan thanh: co UI/API/service chinh va luong chay co the dung duoc theo muc tieu UC.
- Hoan thanh mot phan: co nen tang hoac luong chinh, nhung thieu acceptance criteria/state/audit/edge case quan trong cua SRS.
- Chua lam: chua thay luong chinh trong code, hoac chi co thanh phan khong phuc vu UC do.

| Module | Pham vi | Danh gia tong quan |
| --- | --- | --- |
| 1. Xac thuc & Tai khoan | UC01-UC05 | Hoan thanh mot phan: co Supabase auth, OTP, login/logout/reset/profile; thieu account_status chuan, lock 5 lan sai, teacher onboarding state. |
| 2. Tim kiem & Khoa hoc | UC06-UC08 | Gan hoan thanh: co list/search/detail/free lesson, API that; can ra soat permission hoc thu va data public/private. |
| 3. Mua hang & Thanh toan | UC09-UC12 | Hoan thanh mot phan: co PayOS/order/webhook/revenue split/complaint; thieu payment attempt, refund/reconcile, phu huynh mua cho con, coupon. |
| 4. Hoc tap | UC13-UC20 | Hoan thanh mot phan: co khoa da mua, video/tai lieu, progress, quiz/exam, review; thieu submit assignment cho student, unlock rule day du, certificate. |
| 5. Tuong tac & Ho tro | UC21-UC23 | Mot phan nho: Q&A hoc sinh-giao vien co; AI chat va AI roadmap chua co. |
| 6. Phu huynh | UC24-UC29 | Hoan thanh kha tot phan loi: co link, accept/reject/unlink, progress, payment history, message; can bo sung privacy consent va audit day du hon. |
| 7. Giao vien | UC30-UC37 | Hoan thanh mot phan: co course/content/question/exam/grading/Q&A/revenue/bank; thieu teacher approval gate, rule 3 chuong/final exam, audit/versioning day du. |
| 8. Admin | UC38-UC44 | Hoan thanh mot phan: co dashboard/user/course approval/complaint/payout; thieu security rule, reconcile/refund, broadcast notification dung SRS. |

## 3. Doi chieu chi tiet 44 use case

### Module 1: Xac thuc & Tai khoan

| UC | REQ | Yeu cau SRS | Trang thai | Bang chung code | Phan thieu/chua khop |
| --- | --- | --- | --- | --- | --- |
| UC01 | REQ-AUTH-001 | Dang ky tai khoan HS/PH/GV, xac thuc email, GV co ho so chuyen mon/bank/tai lieu va `teacher_profile_state`. | Hoan thanh mot phan | `AuthController`, `AuthService`, `OtpService`, `Register.tsx`. | Dang ky GV chua thu thap/cham duyet ho so theo SRS; chua co `account_status`, `teacher_profile_state`; OTP 5 phut khac flow email activation 24h trong SRS. |
| UC02 | REQ-AUTH-002 | Dang nhap, JWT/refresh, lock tam sau 5 lan sai/15 phut, chan account bi khoa. | Hoan thanh mot phan | `AuthService.login`, `JwtAuthenticationFilter`, `Login.tsx`. | Chua thay `failed_login_lock_until`; `Profile.isBlocked` co nhung chua thay filter enforce trong auth flow; token/session invalidation sau khoa user chua day du. |
| UC03 | REQ-AUTH-003 | Dang xuat, huy phien/token. | Hoan thanh mot phan | `AuthController.logout`, `AuthService.logout`, `useAuthStore`. | Logout revoke provider refresh token, nhung comment code ghi access token van song den het TTL; SRS yeu cau vo hieu hoa phien ro hon. |
| UC04 | REQ-AUTH-004 | Dat lai mat khau an toan, OTP/link, token cu bi rotate/vo hieu. | Hoan thanh mot phan | `ForgotPassword.tsx`, `requestPasswordResetOtp`, `verifyOtpAndResetPassword`. | Co anti-enumeration va OTP; chua co bang chung rotate/invalidate toan bo session cu sau reset. |
| UC05 | REQ-AUTH-005 | Cap nhat ho so ca nhan, avatar, rieng GV co thong tin ngan hang/ho so. | Hoan thanh mot phan | `ProfileController`, `ProfileService`, `TeacherBankController`, `TeacherBankService`. | Ho so chung co; bank GV co audit co ban; thieu bank review state `BANK_INFO_PENDING_REVIEW`, OTP xac thuc thay doi bank, ma hoa AES-256 theo SRS. |

### Module 2: Tim kiem & Khoa hoc

| UC | REQ | Yeu cau SRS | Trang thai | Bang chung code | Phan thieu/chua khop |
| --- | --- | --- | --- | --- | --- |
| UC06 | REQ-CRS-001 | Tim/loc khoa hoc theo tu khoa, linh vuc, cap lop, gia. | Hoan thanh | `CourseController`, `CourseService`, `CoursesPage.tsx`, `courseService.ts`. | Can bo sung test E2E/coverage; comment code van nhac mock seed nhung page chinh da goi API. |
| UC07 | REQ-CRS-002 | Xem chi tiet khoa hoc public. | Hoan thanh | `GET /api/courses/{id}`, `CourseDetailPage.tsx`. | Can tiep tuc ra soat cac tab trong page vi file van co comment lich su `MOCK_COURSES`; nhung luong API da ton tai. |
| UC08 | REQ-CRS-003 | Hoc thu bai free `isFree = true`. | Hoan thanh mot phan | `Lesson.isFree`, public route `/courses/:id`, signed URL chi tra khi co quyen. | Can kiem chung chi bai `isFree=true` duoc xem khi chua login va bai khong free bi khoa trong moi truong that; chua co test SRS rieng. |

### Module 3: Mua hang & Thanh toan

| UC | REQ | Yeu cau SRS | Trang thai | Bang chung code | Phan thieu/chua khop |
| --- | --- | --- | --- | --- | --- |
| UC09 | REQ-PAY-001 | Mua khoa hoc, HS/PH, chon con ACTIVE, coupon server-side, tao Order PENDING 30 phut. | Hoan thanh mot phan | `OrderController`, `OrderService.createOrder`, `CheckoutPage.tsx`. | Chi cho role student mua; chua co PH mua cho con; chua co coupon/snapshot discount; order expire 15 phut thay vi 30 phut trong SRS. |
| UC10 | REQ-PAY-002 | Thanh toan VNPay/MoMo, payment_attempt, webhook idempotent, revenue_splits, cap quyen. | Hoan thanh mot phan | PayOS integration trong `OrderService`, `PayOSWebhookController`, `RevenueSplit`, `Enrollment`. | SRS yeu cau VNPay/MoMo nhung code dung PayOS; chua co `PaymentAttempt`, `PAYMENT_REVIEW`, `reconciliation_status`, retry theo attempt, amount/currency/gateway mismatch day du; co `devMode` bypass signature can canh bao khi deploy. |
| UC11 | REQ-PAY-003 | Lich su mua hang, loc, chi tiet, hoa don. | Hoan thanh mot phan | `OrdersPage.tsx`, `OrderController.listOrders`, parent payment history. | Chua thay filter nang cao, hoa don PDF, reconciliation/refund view. |
| UC12 | REQ-PAY-004 | Gui khieu nai lien quan giao dich/khoa hoc/doanh thu. | Hoan thanh | `ComplaintController`, `ComplaintService`, `ComplaintsPage.tsx`, `AdminComplaintController`. | Chua gan sau voi refund workflow va payment review theo SRS 4.10. |

### Module 4: Hoc tap

| UC | REQ | Yeu cau SRS | Trang thai | Bang chung code | Phan thieu/chua khop |
| --- | --- | --- | --- | --- | --- |
| UC13 | REQ-LRN-001 | Xem danh sach khoa da mua. | Hoan thanh | `ProfileController /api/me/courses`, `Enrollment`, `CoursesPage`, `ProgressPage`. | Enrollment chua gan `course_version_id` tai thoi diem mua theo SRS. |
| UC14 | REQ-LRN-002 | Xem bai giang/tai lieu, tinh tien do hoc. | Hoan thanh mot phan | `CourseDetailPage.tsx`, `CourseService`, `StudentVideoProgressService`, signed URL video. | `BRULE-WATCH-001` yeu cau unique watched duration; code hien luu position/duration, chua thay tracking segment unique. |
| UC15 | REQ-LRN-003 | Tai tai lieu hoc tap. | Hoan thanh mot phan | `CourseDocument`, `ContentUploadService`, UI download trong `CourseDetailPage.tsx`. | Tai lieu co public/signed URL tuy loai; chua thay watermark PDF/log download/TTL 5 phut cho document nhu SRS phu luc. |
| UC16 | REQ-LRN-004 | Nop bai tap, deadline, file, late policy. | Chua lam day du | Co model `Assignment`, `AssignmentSubmission` va teacher grading. | Chua thay student controller/page submit assignment; chua co deadline/resubmit/late policy theo `BRULE-ASSIGN-001`, `BRULE-LATE-001`. |
| UC17 | REQ-LRN-005 | Lam quiz/chapter test/final exam, unlock 100%, anti-cheat, retake approval. | Hoan thanh mot phan | `QuizService`, `ExamService`, `StudentQuizPage`, `StudentExamPage`. | Co quiz/exam va cham objective/essay; chua enforce unlock 100% day du, fullscreen/tab tracking, autosave 15s, `RETAKE_LOCKED`, `RetakeApproval`, final exam la dieu kien certificate. |
| UC18 | REQ-LRN-006 | Xem diem va tien do hoc tap. | Hoan thanh | `CourseProgressService`, `ProgressPage.tsx`, parent progress report. | Chua gan voi AI roadmap suggestion UC23. |
| UC19 | REQ-LRN-007 | Danh gia khoa hoc. | Hoan thanh | `CourseReviewController`, `CourseReviewService`, UI review trong `CourseDetailPage.tsx`, `ReviewsPage.tsx`. | Can bo sung test spam/one-review-per-enrollment neu SRS yeu cau. |
| UC20 | REQ-LRN-008 | Xem/tai chung chi PDF QR sau 100% va final exam PASSED. | Chua lam | Khong thay model/controller/page certificate. | Can them certificate lifecycle `NOT_ISSUED/ISSUED/NEEDS_REVIEW/REISSUED/REVOKED`, PDF QR verify, signed URL 10 phut. |

### Module 5: Tuong tac & Ho tro

| UC | REQ | Yeu cau SRS | Trang thai | Bang chung code | Phan thieu/chua khop |
| --- | --- | --- | --- | --- | --- |
| UC21 | REQ-INT-001 | Hoc sinh gui cau hoi cho giao vien, public/private, dinh kem anh. | Hoan thanh mot phan | `QaController`, `QaService`, `MessagesPage`, Q&A tab trong `CourseDetailPage`. | Can kiem tra visibility public/private co enforce day du o list/detail/notification; SRS yeu cau pending va notification trong 5 phut. |
| UC22 | REQ-INT-002 | Chat AI ho tro hoc sinh, consent/opt-out/fallback. | Chua lam | Chi thay `AiScanService` cho giao vien scan PDF tao cau hoi. | Chua co chat widget, AI Engine REST, timeout 15s, opt-out, xoa lich su. |
| UC23 | REQ-INT-003 | AI de xuat lo trinh hoc ca nhan hoa. | Chua lam | Khong thay API/page roadmap AI. | Can thiet ke AI context toi thieu, consent, luu lich su/xoa lich su, fallback. |

### Module 6: Phu huynh

| UC | REQ | Yeu cau SRS | Trang thai | Bang chung code | Phan thieu/chua khop |
| --- | --- | --- | --- | --- | --- |
| UC24 | REQ-PRN-001 | Theo doi tien do hoc tap cua con khi link ACTIVE. | Hoan thanh mot phan | `ParentController`, `ParentService.getChildOverview/getChildProgressReport`, `ParentProgress.tsx`, `ParentDashboard.tsx`. | Code dung status `ACCEPTED` map sang active; thieu privacy consent chi tiet theo `BRULE-PRIVACY-001`. |
| UC25 | REQ-PRN-002 | Lien he va nhan thong bao tu giao vien. | Hoan thanh | `ParentMessages.tsx`, `ParentService`, email service, notification. | Can bo sung audit/visibility theo chinh sach rieng tu neu SRS can. |
| UC26 | REQ-PRN-003 | Xem lich su thanh toan cua con. | Hoan thanh | `ParentPayments.tsx`, `ParentService.getChildPaymentHistory`. | Chua co phan PH thanh toan mua khoa cho con trong UC09; lich su dua tren order/enrollment hien co. |
| UC27 | REQ-PRN-004 | Gui loi moi lien ket con. | Hoan thanh | `ParentStudentLink.tsx`, `ParentController`, `ParentService.sendLinkInvitation`, email/notification. | Can them audit log o moi thao tac parent side; hien audit ro hon o student service. |
| UC28 | REQ-PRN-005 | Hoc sinh chap nhan/tu choi link. | Hoan thanh | `StudentParentLinkController`, `StudentParentLinkService`. | Ten status `ACCEPTED/REJECTED` khac SRS `ACTIVE/REJECTED` nhung API co map. |
| UC29 | REQ-PRN-006 | Huy lien ket hai phia. | Hoan thanh | Parent/student unlink request/confirm trong `ParentService`, `StudentParentLinkService`. | Can bo sung expire job 7 ngay va privacy audit day du. |

### Module 7: Giao vien

| UC | REQ | Yeu cau SRS | Trang thai | Bang chung code | Phan thieu/chua khop |
| --- | --- | --- | --- | --- | --- |
| UC30 | REQ-TCH-001 | Tao khoa moi, luu nhap/gui duyet, toi thieu 3 chuong va final exam hop le. | Hoan thanh mot phan | `TeacherCourseController`, `TeacherCourseService`, `CoursesPage.tsx`. | Submit chi validate co it nhat 1 chuong va moi chuong co bai; chua bat buoc 3 chuong/final exam; chua gate `TEACHER_APPROVED`. |
| UC31 | REQ-TCH-002 | Cap nhat bai giang/tai lieu, upload video/PDF/slide, versioning/audit. | Hoan thanh mot phan | `ContentUploadService`, `UploadController`, `TeacherCourseService`, `ContentPage.tsx`. | Co upload va course_versions khi submit; chua co encode video 30 phut, video original retention 12 thang, major/minor change audit va migration enrollment version day du. |
| UC32 | REQ-TCH-004 | Tao question bank. | Hoan thanh mot phan | `QuestionController`, `QuestionService`, `QuestionBankPage.tsx`. | Code quan ly cau hoi truc tiep; chua thay entity "ngan hang" rieng voi ten bank unique va trang thai ACTIVE/0 cau hoi nhu SRS. |
| UC33 | REQ-TCH-005 | Cap nhat question bank, them/sua/xoa/import. | Hoan thanh | `QuestionService` CRUD, `bulkCreateQuestions`, `ExcelImportModal.tsx`. | AI-generated question audit/review chua day du. |
| UC34 | REQ-TCH-003 | Tao bai kiem tra/quiz/chapter test/final exam. | Hoan thanh mot phan | `ExamService`, `QuizService`, `ExamPage.tsx`, `QuizChapterPage.tsx`. | Co cau hinh bai kiem tra va random tu question bank; chua phan biet day du quiz/chapter test/final exam cho certificate; chua anti-cheat/retake. |
| UC35 | REQ-TCH-006 | Cham diem bai tap/cau tu luan, sua diem co audit, retake approval. | Hoan thanh mot phan | `AssignmentService.gradeSubmission`, `ExamService.gradeExamAttempt`, `GradesPage.tsx`. | Chua co audit old_score/new_score/reason trong 24h; chua tinh lai certificate `NEEDS_REVIEW`; chua danh sach/approve `RETAKE_LOCKED`. |
| UC36 | REQ-TCH-007 | Tra loi cau hoi hoc sinh. | Hoan thanh | `QaService`, `QAPage.tsx`, notifications. | Can kiem tra visibility private/public bang test. |
| UC37 | REQ-TCH-008 | Xem lich su doanh thu/ky da nhan tien, export Excel phap ly. | Hoan thanh mot phan | `TeacherRevenueController`, `TeacherRevenueService`, `RevenuePage.tsx`, `RevenueSplit`, `PayoutPeriod`. | Co stats/splits/periods; SRS 4.10 khong yeu cau doanh thu realtime tam tinh, nhung can trace nguon, export Excel day du, luu 5 nam va reconcile only. |

### Module 8: Admin

| UC | REQ | Yeu cau SRS | Trang thai | Bang chung code | Phan thieu/chua khop |
| --- | --- | --- | --- | --- | --- |
| UC38 | REQ-ADM-001 | Dashboard quan tri: GMV, platform fee, teacher amount, funds held. | Hoan thanh | `AdminDashboardController`, `AdminDashboardService`, `DashboardAdmin.tsx`. | Can loai bo/phan biet du lieu mock con trong `DashboardAdmin.tsx`; them test voi data that. |
| UC39 | REQ-ADM-002 | Xem danh sach tai khoan nguoi dung. | Hoan thanh | `AdminUserController`, `ProfileRepository.findAllWithEmail`, UI dashboard users. | Chua co trang rieng `/admin/teachers` vi route dang `ComingSoon`; nhung user list nam trong dashboard. |
| UC40 | REQ-ADM-003 | Khoa/mo khoa, doi role, reset password an toan, teacher approval, anti privilege escalation. | Hoan thanh mot phan | `AdminUserController.toggleBlock/changeRole`, UI change role/block. | Thieu audit log, 2FA, dual approval, chong tu khoa/xoa/ha quyen Admin dang login, chong vo hieu Admin cuoi cung, teacher_profile_state, reset link one-time tu Admin. |
| UC41 | REQ-ADM-004 | Duyet khoa hoc approve/reject/needs revision, lich su. | Hoan thanh | `AdminApprovalController`, `ApprovalService`, `ApprovalsPage`, `CourseReviewPage`. | Chua validate chat che dieu kien SRS truoc publish: toi thieu 3 chuong, final exam hop le, version/migration anh huong HS/PH. |
| UC42 | REQ-ADM-005 | Xem va tra loi khieu nai. | Hoan thanh | `AdminComplaintController`, `ComplaintService`, `ComplaintsInbox`. | Chua ket noi hoan tien/partial refund/payment review. |
| UC43 | REQ-ADM-006 | Xac nhan da chuyen khoan GV, UNC, hold bank info, adjustment. | Hoan thanh mot phan | `AdminPayoutController`, `AdminPayoutService`, `PayoutsPanel`. | Co confirm payout; chua co payout cycle state machine day du, UNC file upload, `HOLD_BANK_INFO`, refund adjustment, reconciliation only, bank dual approval. |
| UC44 | REQ-ADM-007 | Gui thong bao den nguoi dung/nhom nguoi dung. | Hoan thanh mot phan | `UserNotificationService`, `AdminNotificationService`. | Co notification noi bo theo su kien; chua thay API/UI broadcast Admin gui den nhom HS/PH/GV, schedule, email/push channel. |

## 4. Cac phan chua lam hoac can bo sung uu tien cao

1. Bo sung state machine dung SRS 4.10

- `profiles`: them `account_status`, `failed_login_lock_until`, `teacher_profile_state`.
- `orders/payments`: them `payment_status`, `refund_status`, `reconciliation_status`, `payment_attempts`.
- `enrollments/course_access`: them `course_version_id`, `access_state`.
- `certificates`: them lifecycle `NOT_ISSUED/ISSUED/NEEDS_REVIEW/REISSUED/REVOKED`.
- `exam_enrollments/retake_approvals`: them retake state, approval audit.
- `teacher_bank_info`: them `BANK_INFO_PENDING_REVIEW/BANK_INFO_REJECTED/ACTIVE`.

2. Hoan thien payment theo SRS

- Tach Order va PaymentAttempt.
- Retry thanh toan giu Order PENDING nhung tao attempt moi.
- Webhook mismatch phai vao `PAYMENT_REVIEW`, khong cap quyen hoc.
- Them refund/partial refund va adjustment revenue/payout.
- Them luong phu huynh mua khoa cho con ACTIVE.
- Neu van dung PayOS thay VNPay/MoMo, can cap nhat SRS/UC hoac them adapter VNPay/MoMo.

3. Hoan thien hoc tap/chung chi

- Student submit assignment co deadline, file, so lan nop, late policy.
- Unlock quiz/chapter test/final exam theo 100% progress dung pham vi.
- Anti-cheat fullscreen/tab tracking, autosave 15s.
- Certificate PDF QR sau 100% + final exam PASSED.
- Khi sua diem final exam, certificate phai `NEEDS_REVIEW` roi `REISSUED/REVOKED`.

4. Hoan thien Admin security

- Audit log cho block/unblock/change role/reset password/teacher approval.
- Khong cho Admin tu khoa/xoa/ha quyen chinh minh.
- Khong cho vo hieu hoa Admin ACTIVE cuoi cung.
- Doi sang/tu role Admin can 2FA + dual approval + reason.
- Token/session cua user bi khoa phai bi revoke hoac bi filter chan ngay.

5. Hoan thien AI

- Tach `AI Scan PDF` cua giao vien voi `AI Chat`/`AI Roadmap` cua hoc sinh.
- Them consent/opt-out/xoa lich su.
- Timeout 15s co fallback sang hoi giao vien hoac lo trinh mac dinh.
- Log prompt/action/source_refs cho cau hoi AI sinh ra va bat buoc GV review/edit/approve.

## 5. Rui ro ky thuat phat hien khi review

- `PayOSWebhookController` co `app.dev-mode=true` se bypass signature. Neu deploy nham production voi co nay, request gia co the tao thanh toan gia.
- Maven wrapper `backend/mvnw.cmd` bi thieu `org.apache.maven.wrapper.MavenWrapperMain`; phai dung `mvn test` he thong. Nen sua wrapper neu team yeu cau lenh chuan.
- `frontend/src/pages/admin/DashboardAdmin.tsx` van co khoi du lieu khoi tao mock, du da co API that cho user/dashboard/payout/complaints. Nen tach mock fallback ro rang hoac xoa khi nop/deploy.
- Frontend auth store luu token trong `localStorage`; comment code cung ghi nhan rui ro XSS. Neu theo NFR security cao hon, nen chuyen refresh token sang HttpOnly cookie/SameSite.
- SRS 4.10 yeu cau Java/Spring Boot nhung README ghi Java 17, `pom.xml` dung Java 21. Can thong nhat moi truong nop/chay.

## 6. Ket qua kiem tra build/test

Da chay cac lenh sau:

| Lenh | Ket qua |
| --- | --- |
| `cmd /c npm run lint` trong `frontend` | Thanh cong, `tsc --noEmit` khong bao loi. |
| `cmd /c npm run build` trong `frontend` | Thanh cong, Vite build xong; co canh bao chunk lon hon 500 kB. |
| `mvn test` trong `backend` | Thanh cong: 21 tests, 0 failures, 0 errors. |

Ghi chu moi truong:

- `npm run lint` truc tiep trong PowerShell bi chan do execution policy cua `npm.ps1`, da chay lai bang `cmd /c`.
- `.\mvnw.cmd test` that bai vi Maven wrapper thieu main class, da chay lai bang Maven he thong `mvn test`.
- Lan dau `mvn test` bi sandbox chan network khi tai dependency; sau khi cho phep network thi test thanh cong.

## 7. De xuat thu tu lam tiep

1. Dong bo SRS voi cong nghe thanh toan thuc te: quyet dinh PayOS hay VNPay/MoMo, roi sua SRS/code cho khop.
2. Them state machine payment/order/refund/reconciliation va payment_attempt truoc, vi anh huong mua hang, enrollment, revenue, payout.
3. Them teacher onboarding state va Admin approval role GV, vi no la precondition cua tat ca `REQ-TCH-*`.
4. Lam certificate + final exam eligibility, vi hien la UC chua co nhung de bi hoi khi demo SRS.
5. Gia co Admin user security/audit truoc khi demo quan tri.
6. Sau do moi lam AI chat/roadmap, vi hien chua co nen tang consent/privacy theo SRS.
