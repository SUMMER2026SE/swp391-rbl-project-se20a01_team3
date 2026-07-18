import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "E:/AI/AIAuditLogSWP.xlsx";
const outputDir = "E:/swp391-rbl-project-se20a01_team3/outputs/019f70fe-a995-7652-94f0-60e3097fd890";
const outputPath = `${outputDir}/AIAuditLogSWP_Final.xlsx`;

const delta = (critical, context, synthesis, decision) =>
  `Critical Thinking: ${critical}\nContextualization: ${context}\nCreative Synthesis: ${synthesis}\nDecision Ownership: ${decision}`;

const entries = [
  {
    type: "DECISION",
    component: "Decomposition",
    context: "Xác định phạm vi và các tính năng khác biệt cho Bee Academy, tránh mở rộng vượt năng lực của nhóm.",
    prompt: "Hãy phân tích bản đặc tả Bee Academy dành cho học sinh THCS, phân rã các nhóm nghiệp vụ chính và đề xuất các tính năng AI hoặc tính năng tạo khác biệt. Với mỗi đề xuất, hãy đánh giá giá trị người dùng, độ phức tạp, rủi ro dữ liệu và mức phù hợp với phạm vi học kỳ.",
    response: "AI đề xuất trợ lý học tập, lộ trình cá nhân hóa, theo dõi phụ huynh, gamification và một số chức năng thi cử nâng cao. Một số ý tưởng hấp dẫn nhưng vượt phạm vi THCS hoặc nguồn lực triển khai.",
    reflection: delta(
      "Danh sách ban đầu quá rộng và có nhiều use case không làm thay đổi giá trị cốt lõi của hệ thống.",
      "Nhóm chỉ có một học kỳ và đối tượng chính là học sinh lớp 6-9 cùng phụ huynh, giáo viên và admin.",
      "Gộp các đề xuất rời rạc thành ba trục: học tập, phụ huynh theo dõi và động lực học bằng điểm thưởng.",
      "Chỉ giữ các tính năng có thể chứng minh bằng SRS và code; loại các đề xuất vượt phạm vi."
    ),
    evidence: "Prompt gốc: AIAuditLogSWP.xlsx; docs/srs-extract.txt; deliverables/SRS_4.15_complete.docx"
  },
  {
    type: "DECISION",
    component: "Abstraction",
    context: "Chuẩn hóa mô hình kinh doanh và vai trò để AI không đề xuất use case lệch luồng dự án.",
    prompt: "Bee Academy là nền tảng học trực tuyến THCS. Học sinh mua khóa qua PayOS; tiền về tài khoản công ty, admin đối soát và chi trả giáo viên theo kỳ. Phụ huynh liên kết để theo dõi con; điểm cao nhất của quiz/exam được quy đổi thành điểm thưởng và voucher 100/200/400; học sinh nhận chứng chỉ khi hoàn thành khóa và đạt điều kiện thi. Hãy kiểm tra các use case hiện có và đề xuất thêm use case phù hợp với mô hình này.",
    response: "AI nhóm nghiệp vụ theo Student, Parent, Teacher và Admin, đồng thời đề xuất các luồng thanh toán, reward, certificate và hỗ trợ học tập. Một số đề xuất ban đầu vẫn thiên về marketplace hoặc chi tiêu nhỏ lẻ ngoài mô hình đã chốt.",
    reflection: delta(
      "AI hiểu đúng các actor nhưng từng mở rộng sang giao dịch trực tiếp giáo viên và micro-transaction không cần thiết.",
      "Doanh thu phải đi qua công ty; học sinh không dùng Bee Coin và không trả thêm tiền cho tính năng phụ.",
      "Giữ gamification nhưng chuyển thành điểm thưởng từ kết quả học và voucher dùng tùy ý khi mua khóa.",
      "Chốt PayOS, admin payout thủ công, parent monitoring, reward voucher và certificate."
    ),
    evidence: "README.md; docs/srs-extract.txt; backend/.../OrderService.java; backend/.../RewardService.java"
  },
  {
    type: "VERIFICATION",
    component: "Pattern Recognition",
    context: "Kiểm tra tính nhất quán giữa use case, SRS và luồng nghiệp vụ đang triển khai.",
    prompt: "Dựa trên SRS Bee Academy và mã nguồn hiện tại, hãy rà soát toàn bộ use case theo chuỗi Actor -> tiền điều kiện -> luồng chính -> ngoại lệ -> hậu điều kiện. Chỉ ra các use case lệch mô hình thanh toán, phân quyền, phiên bản khóa học hoặc điều kiện hoàn thành và đề xuất cách điều chỉnh tối thiểu.",
    response: "AI phát hiện nhiều điểm lệch giữa đặc tả và code như payout giáo viên, quyền xem nội dung, điều kiện hoàn thành khóa, payment reconciliation và dữ liệu theo course version.",
    reflection: delta(
      "Không thể coi một use case là hoàn thành chỉ vì đã có giao diện; cần kiểm tra xuyên suốt UI, API, rule, dữ liệu và test.",
      "Bee Academy có nhiều state machine liên quan order, enrollment, exam, certificate và parent link.",
      "Dùng một khung đánh giá thống nhất cho 44 UC và tách rõ cải tiến ngoài SRS khỏi phần bắt buộc.",
      "Ưu tiên sửa lỗi làm thay đổi nghiệp vụ; các khác biệt ít rủi ro được ghi nhận để xem xét riêng."
    ),
    evidence: "SRS_CODE_REVIEW_BEE_ACADEMY.md; Bao_cao_danh_gia_SRS_4_14_Bee_Academy.docx; backend tests"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Decomposition",
    context: "Thiết kế luồng đăng nhập Google phù hợp với frontend React và backend Spring Boot dùng Supabase Auth.",
    prompt: "Hãy thiết kế chi tiết luồng đăng nhập Google cho Bee Academy: điểm bắt đầu ở frontend, OAuth callback, trao đổi token với Supabase, tạo hoặc đồng bộ profile, xác minh JWT ở backend, điều hướng theo role và xử lý tài khoản chưa được duyệt hoặc token hết hạn. Nêu rõ dữ liệu nào không được đặt ở frontend.",
    response: "AI phân rã luồng OAuth thành redirect, callback, nhận session, đồng bộ profile và kiểm tra role. API key/service-role phải nằm ở backend; frontend chỉ giữ token cần thiết cho phiên người dùng.",
    reflection: delta(
      "Sơ đồ OAuth tổng quát chưa đủ nếu bỏ qua role, trạng thái giáo viên và lỗi callback.",
      "Hệ thống dùng Supabase GoTrue và Spring Security stateless JWT, không tự phát hành một loại session thứ hai.",
      "Kết hợp OAuth của Supabase với profile/role của Bee Academy và redirect an toàn theo từng actor.",
      "Dùng Supabase làm nhà cung cấp danh tính, backend xác minh JWT và không để secret trong bundle frontend."
    ),
    evidence: "backend/.../AuthService.java; backend/.../SupabaseAuthClient.java; backend/.../JwtAuthenticationFilter.java"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Algorithms",
    context: "Lập kế hoạch đăng ký tài khoản có xác minh email bằng OTP và xử lý các trạng thái lỗi.",
    prompt: "Hãy lập kế hoạch triển khai đăng ký tài khoản Bee Academy bằng họ tên, email, mật khẩu và OTP gửi qua email. Trình bày thuật toán tạo OTP, thời hạn, giới hạn gửi lại, xác minh một lần, chống dò email, tạo profile theo role và cách rollback nếu Auth Provider hoặc email tạm thời lỗi.",
    response: "AI đề xuất tách request OTP, verify OTP và register; lưu OTP có hạn dùng, vô hiệu sau khi sử dụng, giới hạn thử và trả lỗi không làm lộ email đã tồn tại.",
    reflection: delta(
      "Chỉ gửi mã và so sánh chuỗi là chưa đủ; cần expiry, one-time use, rate limit và xử lý provider unavailable.",
      "Đăng ký phải đồng bộ Supabase Auth với profile nội bộ và không cho tạo role Admin từ public API.",
      "Gộp xác minh OTP với quy tắc role/profile và mã lỗi nghiệp vụ nhất quán.",
      "Triển khai OTP phía backend, chỉ tạo profile sau khi xác minh hợp lệ và giữ thông báo chống enumeration."
    ),
    evidence: "backend/.../OtpService.java; backend/.../AuthService.java; backend/.../RequestOtpRequest.java; backend/.../VerifyOtpRequest.java"
  },
  {
    type: "DECISION",
    component: "Abstraction",
    context: "Thay cơ chế đánh dấu hoàn thành thủ công bằng tiến độ tự động từ video và quiz.",
    prompt: "Hãy thiết kế lại tiến độ khóa học để không còn nút 'Đánh dấu xong'. Một bài chỉ được ghi nhận dựa trên trạng thái xem video và hoàn thành quiz; cần hỗ trợ video upload, YouTube/Vimeo, refresh trang và dữ liệu cũ. Hãy giữ nguyên các phần không liên quan.",
    response: "AI bỏ đánh dấu tay, nối trạng thái quiz vào tiến độ và phát hiện iframe YouTube/Vimeo không phát sinh onEnded như thẻ video HTML5, nên cần player API riêng.",
    reflection: delta(
      "Giả định onEnded hoạt động với mọi nguồn video là sai; iframe nhúng cần cơ chế theo dõi riêng.",
      "Tiến độ phải phản ánh hành vi học thật và không bị người học tự đánh dấu hoàn thành.",
      "Kết hợp video completion, quiz completion và adapter player cho nhiều nguồn video.",
      "Loại bỏ checkbox thủ công và dùng dữ liệu học tập làm nguồn xác định tiến độ."
    ),
    evidence: "frontend/.../CourseDetailPage.tsx; frontend/.../StudentQuizPage.tsx; frontend/.../useCourseStore.ts; lint + build pass"
  },
  {
    type: "DECISION",
    component: "Algorithms",
    context: "Khóa bài học theo thứ tự để học sinh không bỏ qua nội dung trước.",
    prompt: "Hãy bổ sung quy tắc mở bài tuần tự: bài đầu tiên được mở theo quyền sở hữu/học thử; từ bài thứ hai, học sinh chỉ được mở khi bài video trước đã hoàn thành. Quy tắc phải hiển thị nhất quán ở syllabus và màn hình học, đồng thời phân biệt lỗi chưa mua khóa với chưa hoàn thành bài trước.",
    response: "AI giữ nguyên kiểm tra quyền truy cập và thêm lớp khóa tuần tự theo thứ tự lesson, kèm thông báo nguyên nhân cụ thể.",
    reflection: delta(
      "Khóa chỉ ở một vị trí UI sẽ tạo đường vòng; các điểm mở lesson phải dùng cùng helper.",
      "Bài học thử vẫn phải mở độc lập khi isFree=true, không bị khóa oan bởi bài trả phí trước đó.",
      "Kết hợp access control, free preview và prerequisite theo lesson liền trước.",
      "Áp dụng một quy tắc canOpenLesson dùng chung cho syllabus và LearningView."
    ),
    evidence: "frontend/.../CourseDetailPage.tsx; npm lint + production build pass"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Algorithms",
    context: "Đánh số bài xuyên chương và xác định đúng bài cần mở khi bấm Tiếp tục học.",
    prompt: "Hãy đánh số lesson liên tục trên toàn khóa thay vì reset theo chương. Khi bấm 'Tiếp tục học', ưu tiên video đang xem dở; nếu video gần nhất đã hoàn thành thì mở video hợp lệ kế tiếp; nếu chưa có lịch sử thì mở bài đầu tiên. Dữ liệu server và local phải được đồng bộ trước khi chọn bài.",
    response: "AI tạo helper đánh số theo toàn khóa và findContinueLearningLesson để chọn bài dựa trên progress, completed lessons, cập nhật gần nhất và trạng thái mở khóa.",
    reflection: delta(
      "Nút cũ bỏ qua hàm hydrate progress nên thường mở bài đầu tiên dù đã có lịch sử.",
      "Người học có thể truy cập từ chi tiết khóa, danh sách đã mua hoặc yêu thích.",
      "Dùng cùng một thuật toán chọn bài cho mọi entry point và chỉ truyền lessonId sau khi đồng bộ.",
      "Chọn bài đang dở trước, sau đó bài kế tiếp; không dùng mặc định cố định."
    ),
    evidence: "frontend/.../CourseDetailPage.tsx; frontend/.../FavoritesPage.tsx; npm lint pass"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Algorithms",
    context: "Lưu và khôi phục vị trí xem video giữa nhiều lần truy cập và nhiều thiết bị.",
    prompt: "Hãy triển khai chức năng xem tiếp video theo thời gian thực: lưu vị trí định kỳ, khi pause, đổi bài, ẩn tab hoặc rời trang; đồng bộ theo từng học sinh ở backend; có local fallback khi mất mạng; khi mở lại chọn bản cập nhật mới hơn giữa local và server. Hỗ trợ video upload, YouTube và Vimeo.",
    response: "AI thêm student_video_progress, API lưu tiến độ và adapter player; frontend lưu cục bộ và đồng bộ backend theo chu kỳ, sau đó khôi phục đúng mốc xem gần nhất.",
    reflection: delta(
      "Chỉ dùng localStorage sẽ sai giữa thiết bị; chỉ gọi backend khi rời trang có thể mất dữ liệu.",
      "Mạng của học sinh có thể gián đoạn và mỗi loại player cung cấp API thời gian khác nhau.",
      "Kết hợp optimistic local cache, backend source of truth và quy tắc last-updated-wins.",
      "Lưu nhiều điểm an toàn, đồng bộ backend và khôi phục theo dữ liệu mới nhất."
    ),
    evidence: "Git 71313f9, f733d51; V023__student_video_progress.sql; StudentVideoProgressService.java; 14/14 backend tests"
  },
  {
    type: "VERIFICATION",
    component: "Algorithms",
    context: "Chặn toàn bộ thao tác tua video nhưng vẫn hiển thị thời gian và giữ khả năng khôi phục hợp lệ.",
    prompt: "Hãy kiểm tra và sửa chức năng chống tua video. Phải chặn kéo, click một điểm trên timeline, pointer/touch, phím mũi tên và focus bằng Tab; timeline vẫn hiển thị tiến độ. Phân biệt thao tác seek trái phép với seek hợp lệ do hệ thống khôi phục vị trí hoặc mở ghi chú đã xem.",
    response: "AI nhận ra native video controls không thể chặn đáng tin cậy, nên thay bằng progress chỉ đọc, chặn mọi interaction và giữ onSeeking/seeked làm lớp bảo vệ cho video upload lẫn video nhúng.",
    reflection: delta(
      "Bản đầu chỉ hiện toast và trả currentTime trong seeking nhưng click từng đoạn vẫn thắng do race condition.",
      "Yêu cầu áp dụng cho chuột, cảm ứng, bàn phím và nhiều player; seek từ code vẫn phải hoạt động có kiểm soát.",
      "Kết hợp custom controls chỉ đọc, event guard và cờ phân biệt programmatic seek.",
      "Loại native timeline, chặn mọi input và chỉ cho phép khôi phục/mốc hợp lệ từ hệ thống."
    ),
    evidence: "Git f733d51, 129b743; CourseDetailPage.tsx; EmbeddedVideoPlayer.tsx; TypeScript + build pass"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Pattern Recognition",
    context: "Thêm ghi chú cá nhân gắn với mốc thời gian video và tránh xung đột với quy tắc chống tua.",
    prompt: "Hãy thiết kế ghi chú theo lesson và timestamp cho video: học sinh tạo, sửa, xóa, xem lại ghi chú; dữ liệu phải riêng tư theo tài khoản và đồng bộ backend. Khi hiển thị timestamp, chỉ cho nhảy tới mốc hợp lệ theo chính sách chống tua hoặc hiển thị như nhãn nếu chưa đủ quyền seek.",
    response: "AI thêm bảng/API lesson notes và giao diện ghi chú nổi trên video. Timestamp được truyền qua nhánh programmatic seek để không bị guard hiểu nhầm là thao tác tua trái phép.",
    reflection: delta(
      "Timestamp ban đầu chỉ là span nên không có hành vi; cho seek tự do lại tạo đường vòng qua chống tua.",
      "Ghi chú thuộc từng học sinh và lesson, cần hoạt động với vị trí xem được lưu.",
      "Kết hợp note CRUD, timestamp và policy seek có kiểm soát.",
      "Lưu note ở backend và chỉ cho nhảy mốc khi thỏa quy tắc học tập."
    ),
    evidence: "Git 71313f9, f27cf40; V022__student_lesson_notes.sql; StudentLessonNoteServiceTest.java"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Abstraction",
    context: "Giới hạn Q&A theo đúng bài học thay vì hiển thị câu hỏi ở mọi lesson.",
    prompt: "Hãy sửa Q&A để mỗi thread gắn với course và lesson cụ thể. Học sinh chỉ thấy câu hỏi của bài đang mở; giáo viên vẫn có thể lọc theo khóa, chương và bài. Kiểm tra quyền sở hữu khóa, tệp ảnh đính kèm, trạng thái pending/answered/resolved và thông báo.",
    response: "AI chuẩn hóa quan hệ Q&A theo lesson, cập nhật controller/service và lọc ở frontend để tránh rò câu hỏi sang bài khác.",
    reflection: delta(
      "Chỉ lọc ở frontend không ngăn API trả dữ liệu của lesson khác.",
      "Một khóa có nhiều lesson và câu hỏi phải giữ đúng ngữ cảnh học tập.",
      "Dùng lessonId làm khóa phạm vi, đồng thời giữ dashboard giáo viên ở mức toàn khóa.",
      "Ràng buộc Q&A theo lesson ở backend và truyền đúng lessonId từ UI."
    ),
    evidence: "Git eda637a; QaService.java; QaController.java; CourseDiscussionService.java; QaImagePicker.tsx"
  },
  {
    type: "VERIFICATION",
    component: "Pattern Recognition",
    context: "Sửa trường hợp đã có review nhưng tổng số và điểm trung bình vẫn hiển thị bằng 0.",
    prompt: "Hãy truy vết luồng review từ database/service đến UI khi danh sách đã có một đánh giá nhưng reviewCount và averageRating vẫn bằng 0. Xác định nguồn dữ liệu chuẩn, cập nhật ngay sau submit và tránh nhân đôi logic giữa trang giới thiệu và LearningView.",
    response: "AI tách review panel dùng chung, thêm tab review trong LearningView và dùng dữ liệu review thực tế làm fallback khi summary API chưa đồng bộ.",
    reflection: delta(
      "Fallback phía client sửa trải nghiệm nhưng có thể che lỗi aggregate backend nếu dùng lâu dài.",
      "Người đã mua thường vào thẳng LearningView nên chức năng review không nên chỉ nằm ở marketing view.",
      "Tái sử dụng một panel và cập nhật optimistic, trong khi backend vẫn là nguồn tổng hợp chính.",
      "Cho hiển thị tức thời nhưng giữ nhiệm vụ sửa summary ở tầng dịch vụ khi có sai lệch."
    ),
    evidence: "Git 9acc089, 7398416; CourseDetailPage.tsx; CourseReviewService.java; CourseReviewServiceTest.java"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Algorithms",
    context: "Tìm kiếm tiếng Việt bị khớp sai từ khóa ngắn với một phần trong tên giáo viên hoặc từ khác.",
    prompt: "Hãy sửa thuật toán tìm kiếm khóa học để từ khóa 'anh' tìm đúng 'Tiếng Anh' nhưng không khớp nhầm 'Thành' hoặc 'danh'. Vẫn phải hỗ trợ không dấu, không phân biệt hoa thường, lọc/sắp xếp hiện có và chỉ trả khóa PUBLISHED.",
    response: "AI thay tìm kiếm substring %keyword% bằng chuẩn hóa token và so khớp tại ranh giới đầu từ, giữ các điều kiện lọc hiện có.",
    reflection: delta(
      "LIKE %anh% tạo false positive; chỉ so exact lại bỏ mất truy vấn nhiều từ.",
      "Tên khóa và giáo viên có dấu tiếng Việt, dấu gạch và khoảng trắng không đồng nhất.",
      "Chuẩn hóa dấu/ký tự rồi áp dụng word-boundary/prefix theo token.",
      "Dùng khớp đầu từ sau chuẩn hóa để cân bằng precision và recall."
    ),
    evidence: "Git a59c973, da950e5; CourseSpecifications.java; mvn test 68 tests pass"
  },
  {
    type: "VERIFICATION",
    component: "Abstraction",
    context: "Bổ sung UC08 học thử mà không làm lộ tài liệu hoặc khóa nhầm bài miễn phí.",
    prompt: "Dựa trên UC08, hãy rà soát quyền học thử: guest chỉ mở lesson isFree=true; bài không miễn phí không được trả video URL hoặc tài liệu; bài free phải mở độc lập dù không đứng đầu chương; ghi nhận lượt preview và giữ CTA mua khóa. Hạn chế thay đổi ngoài phạm vi.",
    response: "AI phát hiện frontend khóa oan bài free bởi prerequisite và backend trả metadata tài liệu của lesson bị khóa; sau đó sửa cả response và UI, bổ sung test.",
    reflection: delta(
      "Chỉ ẩn nút trên UI không ngăn dữ liệu private bị trả qua API.",
      "Học thử phải hoạt động cho guest và không phụ thuộc tiến độ của khóa chưa mua.",
      "Tách quyền preview khỏi prerequisite học tuần tự, đồng thời che nội dung ở DTO backend.",
      "Mở riêng lesson free, ẩn dữ liệu lesson trả phí và ghi nhận preview có kiểm soát."
    ),
    evidence: "LessonResponse.java; LessonResponseTest.java; CourseDetailPage.tsx; V029__course_preview_views.sql; 23 tests pass"
  },
  {
    type: "VERIFICATION",
    component: "Pattern Recognition",
    context: "Hoàn thiện danh sách khóa đã mua và xác định trạng thái học đúng nghiệp vụ.",
    prompt: "Dựa trên UC13, hãy hoàn thiện danh sách khóa đã mua: hiển thị tiến độ, ngày mua, lần học gần nhất; lọc not_started/in_progress/completed; trạng thái rỗng; điều hướng vào bài cần học. completed chỉ khi tiến độ 100% và đạt đủ bốn bài thi bắt buộc.",
    response: "AI cập nhật CourseService và test: 0% là not_started, 100% cộng đủ bốn bài PASSED là completed, còn lại in_progress; dữ liệu lần học gần nhất được tổng hợp từ các hoạt động học.",
    reflection: delta(
      "Điều kiện cũ chỉ kiểm tra final exam làm trạng thái completed sai so với luồng nhóm chốt.",
      "Khóa học có bốn bài thi bắt buộc và dữ liệu phải theo phiên bản enrollment.",
      "Kết hợp progress nội dung, exam status và last activity thành một trạng thái dễ lọc.",
      "Chốt completed = 100% + bốn bài PASSED và khóa quy tắc bằng unit test."
    ),
    evidence: "CourseService.java; CourseServiceTest.java; task UC13-UC20; 94/94 backend tests"
  },
  {
    type: "DECISION",
    component: "Algorithms",
    context: "Thiết kế điểm thưởng theo kết quả cao nhất và voucher có thể dùng an toàn trong checkout.",
    prompt: "Hãy triển khai reward cho Bee Academy: mỗi học sinh và mỗi quiz/exam chỉ nhận điểm theo kết quả cao nhất; nếu điểm tăng thì chỉ cộng phần chênh lệch. Cho phép đổi voucher 100/200/400 điểm và tùy ý áp dụng khi mua khóa. Thiết kế ledger, idempotency, trạng thái voucher, reserve/use/release và trường hợp tổng thanh toán về 0 đồng.",
    response: "AI tạo ví điểm, nguồn điểm theo assessment, catalog voucher và voucher của học sinh; nối vào quiz/exam/order. Đơn 0 đồng được cấp enrollment trực tiếp, còn đơn có tiền gửi số sau giảm sang PayOS.",
    reflection: delta(
      "Cộng điểm mỗi lần thi lại hoặc xử lý webhook lặp sẽ tạo gian lận và sai số dư.",
      "Điểm phát sinh từ học tập, không phát sinh từ payment; voucher chỉ được xác nhận USED khi order hoàn tất.",
      "Dùng ledger bất biến, best-score snapshot và lifecycle voucher gắn order.",
      "Chỉ cộng delta khi best score tăng; reserve một lần và validate lại ở backend checkout."
    ),
    evidence: "Git e96df8d; V027__reward_points_vouchers.sql; RewardService.java; OrderService.java; RewardsPage.tsx"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Decomposition",
    context: "Cho học sinh xem số dư, lịch sử điểm và voucher cá nhân mà không phụ thuộc trang checkout.",
    prompt: "Hãy bổ sung trang Điểm thưởng cho học sinh: hiển thị số dư hiện tại, nguồn cộng điểm, voucher có thể đổi, voucher đã sở hữu và trạng thái sử dụng; cho đổi voucher qua API và điều hướng sử dụng tại checkout. Mọi số dư và điều kiện phải lấy từ backend.",
    response: "AI thêm RewardController, RewardWalletResponse, rewardService frontend và RewardsPage; checkout đọc cùng nguồn dữ liệu để tránh chênh lệch.",
    reflection: delta(
      "Tính số dư ở frontend từ lịch sử giao dịch dễ lệch và cho phép sửa dữ liệu client.",
      "Học sinh cần xem reward ngoài thời điểm mua khóa và voucher được dùng tùy ý.",
      "Dùng một wallet response cho trang reward và checkout, kèm lifecycle rõ ràng.",
      "Backend là nguồn chuẩn; frontend chỉ hiển thị và gửi yêu cầu đổi/áp dụng."
    ),
    evidence: "Git e96df8d; RewardController.java; RewardWalletResponse.java; rewardService.ts; RewardsPage.tsx"
  },
  {
    type: "DECISION",
    component: "Decomposition",
    context: "Xây dựng chứng chỉ PDF có thể xác minh và quản lý vòng đời khi điểm thay đổi.",
    prompt: "Dựa trên SRS Bee Academy, hãy thiết kế module certificate gồm điều kiện cấp, PDF có tên học sinh/khóa/giáo viên/ngày cấp/mã xác minh, QR public verify, lưu private storage, signed URL ngắn hạn và lifecycle NOT_ISSUED, ISSUED, NEEDS_REVIEW, REISSUED, REVOKED.",
    response: "AI tạo migration, model/service/controller, PDF và QR verification, trang chứng chỉ và trang verify public. Bản đầu chỉ gắn eligibility với final exam.",
    reflection: delta(
      "Kiến trúc PDF/QR đúng hướng nhưng điều kiện chỉ final exam chưa khớp quyết định cuối của nhóm là đủ bốn bài.",
      "Chứng chỉ phải theo enrollment/course version và cần tái đánh giá khi điểm bắt buộc thay đổi.",
      "Giữ module lifecycle và signed URL, thay eligibility bằng bộ bốn exam bắt buộc.",
      "Chấp nhận kiến trúc chứng chỉ; không chấp nhận quy tắc final-only."
    ),
    evidence: "Git d89fbb2; V028__certificates.sql; CertificateService.java; CertificateVerifyPage.tsx; 21 tests pass"
  },
  {
    type: "VERIFICATION",
    component: "Abstraction",
    context: "Đồng bộ điều kiện chứng chỉ với bốn bài thi và phiên bản khóa học mà không phá dữ liệu cũ.",
    prompt: "Hãy rà soát UC20 và sửa eligibility: học sinh chỉ đủ điều kiện khi hoàn thành 100% nội dung và đạt đủ bốn bài thi bắt buộc thuộc đúng course_version_id. Khi điểm của bất kỳ bài nào thay đổi, chứng chỉ phải vào NEEDS_REVIEW rồi REISSUED hoặc REVOKED. Giữ fallback cho dữ liệu legacy và không ghi đè cấu hình thi của phiên bản cũ.",
    response: "AI phát hiện schema course+slot có thể ghi đè bộ đề cũ, đề xuất snapshot/freeze exam config theo version và service eligibility riêng. Các lần phân tích trước từng mâu thuẫn giữa final-only và bốn bài.",
    reflection: delta(
      "Chỉ thêm course_version_id vào query không đủ vì cấu hình cũ đã dùng chung; final-only cũng không đúng quyết định đã xác nhận.",
      "Enrollment cũ phải tiếp tục xem đúng bộ đề, trong khi khóa mới có phiên bản độc lập.",
      "Kết hợp snapshot exam config, resolver theo enrollment và eligibility dùng đủ bốn exam id.",
      "Chốt 100% + bốn bài PASSED; mọi thay đổi điểm bắt buộc đều kích hoạt review chứng chỉ."
    ),
    evidence: "CertificateEligibilityService.java; ExamConfigVersionService.java; V043__versioned_required_exam_configs.sql; 91/91 tests ở lần triển khai"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Algorithms",
    context: "Hoàn thiện UC16 với deadline, nộp lại và chính sách nộp muộn.",
    prompt: "Hãy triển khai phần còn thiếu của UC16: kiểm tra deadline ở upload và submit, mặc định tối đa ba lần nộp, trạng thái open/overdue/late_allowed/closed/attempts_exhausted/graded, cấu hình nộp muộn và phần trăm trừ điểm. Giữ tương thích bài tập cũ và hạn chế sửa ngoài luồng nộp bài.",
    response: "AI mở rộng Assignment/Submission, service, controller, migration và UI giáo viên; mức phạt được snapshot theo lần nộp và áp dụng khi chấm.",
    reflection: delta(
      "Chỉ kiểm tra deadline ở UI có thể bị bỏ qua; số lần nộp và late penalty phải được cưỡng chế server-side.",
      "Code đang giới hạn file 20MB trong khi một bản SRS ghi 25MB; nhóm chọn không đổi ngoài phạm vi khi chưa duyệt.",
      "Dùng policy có default cho dữ liệu cũ và lưu snapshot để lịch sử không đổi khi giáo viên sửa cấu hình.",
      "Triển khai deadline/attempt/late policy ở backend, giữ giới hạn file hiện hành để tránh tác động ngoài yêu cầu."
    ),
    evidence: "V042__assignment_submission_policy.sql; AssignmentService.java; AssignmentServiceTest.java; 81/81 tests"
  },
  {
    type: "VERIFICATION",
    component: "Pattern Recognition",
    context: "Rà soát UC17 về gian lận, autosave và trạng thái thi lại.",
    prompt: "Hãy đối chiếu UC17 với code: kiểm tra bốn bài thi, unlock theo tiến độ, trắc nghiệm/tự luận, autosave, fullscreen, sự kiện gian lận, số lần cảnh báo, tự nộp, cooldown và trạng thái thi lại. Sửa theo state machine trung tâm và ghi audit phía server.",
    response: "AI phát hiện tự nộp ở vi phạm thứ ba thay vì lần thứ tư, thiếu audit server và cooldown 12 giờ chưa được thực thi; sau đó bổ sung integrity event và trạng thái retake.",
    reflection: delta(
      "Đếm vi phạm ở client không đáng tin cậy và trạng thái suy ra rời rạc dễ mâu thuẫn.",
      "SRS yêu cầu cảnh báo ba lần rồi tự nộp ở lần bốn, cùng giới hạn thi lại và cooldown.",
      "Dùng event idempotent, server count và state AVAILABLE/RETAKE_LOCKED/RETAKE_APPROVED.",
      "Đưa audit và quyết định trạng thái về backend; frontend chỉ phản ánh state."
    ),
    evidence: "V044__exam_integrity_events.sql; ExamIntegrityService.java; ExamRetakeService.java; StudentExamPage.tsx"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Abstraction",
    context: "Tổng hợp tiến độ UC18 theo phiên bản khóa và xuất báo cáo PDF.",
    prompt: "Hãy hoàn thiện UC18 mà không làm hỏng progress đang chạy: tổng hợp lesson, quiz và đủ bốn bài thi theo courseVersionId của enrollment; hiển thị điểm/trạng thái/ngày nộp; thêm API và nút xuất PDF; hỗ trợ dữ liệu legacy nhưng cảnh báo khi không xác định được version.",
    response: "AI mở rộng response tiến độ, tạo LearningProgressPdfService và dùng cùng một nguồn dữ liệu cho UI/PDF để tránh chênh lệch.",
    reflection: delta(
      "Nếu PDF tự query lại theo logic khác, số liệu có thể lệch với màn hình; dữ liệu khác version không được cộng chung.",
      "Hệ thống có enrollment cũ thiếu courseVersionId nên cần fallback có cảnh báo.",
      "Tạo một model tổng hợp chuẩn rồi render cả UI và PDF từ model này.",
      "Lọc theo version, luôn trả bốn slot và dùng một nguồn dữ liệu cho báo cáo."
    ),
    evidence: "CourseProgressService.java; LearningProgressPdfService.java; LearningProgressPdfServiceTest.java; 83/83 tests"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Pattern Recognition",
    context: "Không mở được tài liệu PPTX cũ do luồng tải ép di chuyển storage.",
    prompt: "Hãy truy vết lỗi mở tài liệu đính kèm. Kiểm tra record course_documents, bucket/path/fileUrl, quyền enrollment, one-time link và popup blocker. Với PPTX/DOCX legacy đang ở public bucket, không được ép upload lại nếu chỉ cần trả URL hợp lệ; PDF vẫn giữ watermark và luồng bảo vệ.",
    response: "AI xác định bốn record legacy dùng file_url public và migration sang bucket private gây Supabase Bad Request. Backend được sửa để trả/stream từ nơi đang lưu; frontend mở tab ngay trong click để tránh popup blocker.",
    reflection: delta(
      "Giả định mọi file đã nằm ở private bucket là sai; tự migrate trong request tải tạo lỗi và tác dụng phụ.",
      "Dữ liệu lịch sử có storage_bucket/path null nhưng file_url vẫn hợp lệ.",
      "Phân nhánh theo loại và metadata: PDF watermark; file legacy trả URL sau khi kiểm tra quyền và log tải.",
      "Không di chuyển file trong download request; dùng đúng nguồn hiện tại và giữ kiểm soát quyền ở backend."
    ),
    evidence: "StudentDocumentService.java; StudentDocumentServiceTest.java; CourseDetailPage.tsx; 70/70 tests"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Pattern Recognition",
    context: "Khóa học đã yêu thích không xuất hiện do trang chỉ đọc một nguồn course detail.",
    prompt: "Hãy sửa trang Yêu thích để khóa đã mua và khóa chưa mua đều hiển thị ổn định. favoritedIds là nguồn xác định membership; ưu tiên dữ liệu /api/me/courses cho khóa đã enrollment, fallback course detail cho khóa public và không hiển thị empty state trong lúc đang tải.",
    response: "AI merge dữ liệu từ hai nguồn, thêm loading state và giữ số lượng dựa trên favoritedIds.",
    reflection: delta(
      "Course detail public không phải nguồn phù hợp cho mọi khóa đã mua và có thể khiến card bị loại bỏ.",
      "Trang yêu thích chứa cả khóa đã mua và chưa mua, mỗi nhóm có API tối ưu khác nhau.",
      "Tách membership khỏi presentation data và merge theo courseId.",
      "Dùng favoritedIds làm nguồn chuẩn, enrolled courses làm dữ liệu ưu tiên và public detail làm fallback."
    ),
    evidence: "Git da950e5; FavoritesPage.tsx; CourseSpecifications.java; StudentDocumentServiceTest.java"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Decomposition",
    context: "Tạo dữ liệu khóa Lịch sử 7 theo khung chương trình cho giáo viên cụ thể.",
    prompt: "Dựa trên khung chương trình được cung cấp, hãy tạo khóa 'Lịch sử 7 - Kết nối tri thức' cho giáo viên Lê Đại Thành TC. Tách đúng 7 chương và 18 bài, tạo slug/category/order ổn định, không tự bịa video/quiz và viết script chạy lại an toàn không tạo trùng.",
    response: "AI tạo course/chapter/lesson, xác minh đủ 7 chương 18 bài và lưu script idempotent để tái tạo dữ liệu.",
    reflection: delta(
      "Tự sinh nội dung video hoặc câu hỏi khi chưa có nguồn sẽ làm dữ liệu demo không kiểm chứng được.",
      "Mục tiêu là seed cấu trúc để kiểm thử luồng học, không thay thế nội dung học thuật của giáo viên.",
      "Chuyển khung ảnh thành cấu trúc dữ liệu có thứ tự và khóa chống trùng.",
      "Chỉ seed metadata/chương/bài; để video, quiz và tài liệu cho bước được duyệt riêng."
    ),
    evidence: "backend/scripts/create_le_dai_thanh_teacher_history7_course.mjs; course_id ea41e043-...; kiểm tra 7 chương/18 bài"
  },
  {
    type: "VERIFICATION",
    component: "Abstraction",
    context: "Đối chiếu SRS 4.14 với tài liệu mẫu và tạo bản SRS đầy đủ hơn.",
    prompt: "Hãy so sánh cấu trúc và nội dung SRS_mau với SRS_4.14 của Bee Academy. Lập ma trận phần đã có/thiếu, giữ nguyên yêu cầu hợp lệ, bổ sung traceability, state machine, external interface, NFR và test mapping còn thiếu; không bịa chức năng ngoài code/nghiệp vụ đã xác nhận. Xuất bản Word hoàn chỉnh.",
    response: "AI tạo SRS 4.15, giữ nội dung 4.14 và bổ sung các phần cấu trúc còn thiếu so với mẫu.",
    reflection: delta(
      "Sao chép nguyên mẫu có thể đưa yêu cầu của dự án khác vào Bee Academy.",
      "SRS phải bám business model PayOS, course version, parent privacy và bốn bài thi của nhóm.",
      "Dùng mẫu làm khung, nhưng nội dung được đối chiếu với code và quyết định nghiệp vụ.",
      "Chỉ bổ sung cấu trúc/traceability có căn cứ và phát hành bản 4.15 riêng."
    ),
    evidence: "deliverables/SRS_4.15_complete.docx; srs_work/artifact.md; docs/srs-extract.txt"
  },
  {
    type: "PROBLEM-SOLVING",
    component: "Decomposition",
    context: "Tạo SDS Bee Academy theo mẫu nhưng phản ánh đúng kiến trúc và 44 use case hiện có.",
    prompt: "Dựa trên SDS_example, SRS và code Bee Academy, hãy xây dựng SDS đầy đủ: kiến trúc, module, ERD, class/sequence diagram, API, database và thiết kế cho 44 use case. Mọi sơ đồ và mô tả phải truy vết được về mã nguồn hoặc SRS, không thêm thành phần chưa tồn tại.",
    response: "AI tạo tài liệu SDS 141 trang, gồm kiến trúc, ERD, sơ đồ và đặc tả API/database cho 44 UC, sau đó kiểm tra mục lục và cấu trúc.",
    reflection: delta(
      "Tài liệu dài dễ có sơ đồ đẹp nhưng không khớp code; cần kiểm tra tên service, bảng và endpoint thực tế.",
      "Code thay đổi nhanh nên SDS phải ghi rõ trạng thái triển khai và giới hạn.",
      "Dùng SRS làm yêu cầu, code làm bằng chứng và mẫu SDS làm chuẩn trình bày.",
      "Chỉ mô tả kiến trúc có thể truy vết; phần đề xuất được tách khỏi thiết kế hiện hành."
    ),
    evidence: "SDS_BeeAcademy.docx; .codex_tmp/sds_beeacademy/*.puml; kiểm tra 141 trang"
  },
  {
    type: "VERIFICATION",
    component: "Pattern Recognition",
    context: "Đánh giá mức hoàn thành của 44 use case theo SRS thay vì chỉ đếm màn hình hoặc file.",
    prompt: "Hãy đánh giá toàn bộ 44 UC của Bee Academy theo SRS bằng bảng: tên UC, % hoàn thành, phần đã hoàn thành, phần chưa hoàn thành và cải tiến thêm. Chấm theo độ khép kín UI -> API -> business rule/RBAC -> dữ liệu/audit -> test; nêu rõ giả định và không dùng tính năng ngoài SRS để che thiếu sót bắt buộc.",
    response: "AI tổng hợp 8 module, chỉ ra các khoảng trống về payment/refund, auth audit, AI privacy, assignment policy, exam/certificate và phân biệt cải tiến ngoài SRS.",
    reflection: delta(
      "Tỷ lệ tuyệt đối là ước lượng; test xanh không chứng minh đúng SRS nếu test đang khóa một rule sai.",
      "Working tree có thay đổi chưa commit và nhiều UC phụ thuộc dịch vụ ngoài như PayOS/Supabase.",
      "Kết hợp đọc code, migration, build/test và traceability theo UC để tạo đánh giá có căn cứ.",
      "Dùng báo cáo làm backlog ưu tiên, không coi phần trăm là chứng nhận UAT."
    ),
    evidence: "SRS_CODE_REVIEW_BEE_ACADEMY.md; backend 70-94 tests tùy thời điểm; frontend production build pass"
  },
  {
    type: "VERIFICATION",
    component: "Decomposition",
    context: "Hoàn thiện và chuẩn hóa bộ test case UI Automation cho Bee Academy.",
    prompt: "Hãy hoàn thiện toàn bộ test case cho Bee Academy từ workbook hiện có. Giữ nguyên 124 case gốc, bổ sung actor, route, UC mapping, precondition, test data, steps, expected result, selector strategy, priority, cleanup và kỹ thuật BVA/EP/Decision Table; tạo coverage summary và kiểm tra lỗi công thức.",
    response: "AI giữ 124 testcase, thêm sheet Detailed Test Cases và Coverage Summary, đồng thời kiểm tra 5 sheet không có lỗi #REF!, #VALUE! hoặc #N/A.",
    reflection: delta(
      "Nhiều testcase ban đầu chỉ có tiêu đề, chưa đủ dữ liệu để chạy lặp hoặc truy vết SRS.",
      "UI có nhiều actor và trạng thái; test cần dọn dữ liệu để không phụ thuộc lần chạy trước.",
      "Gắn mỗi case với UC/route/selector và kỹ thuật thiết kế test, sau đó tổng hợp coverage.",
      "Giữ case gốc để bảo toàn lịch sử, bổ sung chi tiết ở sheet mới có thể audit."
    ),
    evidence: "outputs/ui-testcases-completed/TestCases_UIAutomation_Completed.xlsx; 124 cases; 5 sheets; formula scan clean"
  }
];

if (entries.length !== 30) {
  throw new Error(`Expected 30 audit entries, got ${entries.length}`);
}

const hallucinations = [
  [
    "006",
    "Oversimplification",
    "Sự kiện onEnded của React đủ để đánh dấu hoàn thành cho cả video upload và iframe YouTube/Vimeo.",
    "Iframe YouTube/Vimeo không phát sinh onEnded như thẻ video HTML5; tiến độ sẽ không tự cập nhật.",
    "Đọc nhánh render player và thử đối chiếu event API của từng nguồn video.",
    "Dùng adapter/player API riêng cho video nhúng và nối trạng thái hoàn thành vào nguồn progress chung."
  ],
  [
    "010",
    "Logic Error",
    "Chặn onSeeking và hiện cảnh báo là đủ để ngăn người học tua video.",
    "Click theo từng đoạn trên native timeline vẫn thay đổi currentTime do race condition; toast xuất hiện nhưng video đã nhảy.",
    "Thử kéo, click, pointer, touch và bàn phím; phát hiện native controls không thể chặn ổn định từ React.",
    "Thay bằng progress chỉ đọc, chặn toàn bộ interaction và giữ seeking/seeked guard làm lớp bảo vệ."
  ],
  [
    "017",
    "Context Misunderstanding",
    "Điểm thưởng nên được ghi sau khi order chuyển PAID vì hệ thống đã có payment flow.",
    "Đặc tả reward quy định điểm phát sinh từ điểm cao nhất của từng quiz/exam; payment chỉ là nơi sử dụng voucher.",
    "Đọc file luồng tích điểm, đối chiếu QuizService, ExamService và yêu cầu người dùng.",
    "Tách reward ledger khỏi payment; chỉ cộng delta best score và dùng voucher trong checkout."
  ],
  [
    "020",
    "Context Misunderstanding",
    "Chứng chỉ chỉ cần hoàn thành 100% nội dung và đạt final exam; hoặc chỉ cần thêm course_version_id vào query hiện tại.",
    "Luồng cuối được người dùng xác nhận yêu cầu đạt đủ bốn bài thi; schema course+slot dùng chung còn có nguy cơ ghi đè bộ đề của version cũ.",
    "Đối chiếu các task UC13-UC20, kiểm tra schema ExamConfig và các test eligibility/version.",
    "Dùng snapshot exam config theo version và eligibility 100% + bốn bài PASSED; thay đổi điểm bất kỳ bài nào đều rà soát chứng chỉ."
  ],
  [
    "024",
    "Context Misunderstanding",
    "Tài liệu PPTX legacy phải được copy sang bucket private course-documents trước khi tải.",
    "Bản ghi cũ có file_url public và thiếu bucket/path; bước copy trong request tải gây Supabase Bad Request.",
    "Truy vấn course_documents và thêm test cho file PPTX legacy.",
    "Kiểm tra quyền rồi trả/stream từ nguồn hiện có; chỉ PDF đi qua watermark, không migrate file trong download request."
  ]
];

await fs.mkdir(outputDir, { recursive: true });
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));

const metadata = workbook.worksheets.getItem("1. Metadata & Summary");
metadata.getRange("C4:C7").values = [["Võ Thị Hà My"], ["DE190242"], ["SWP391"], ["Bee Academy (E-Learning System)"]];
metadata.getRange("C10").values = [[entries.length]];
metadata.getRange("C11").formulas = [["=COUNTA('2. Detailed Audit Log'!$A$4:$A$60)"]];
metadata.getRange("C12").formulas = [["=IFERROR(C11/C10,0)"]];
metadata.getRange("C13").formulas = [["=COUNTA('3. Hallucination Detection'!$A$4:$A$29)"]];
metadata.getRange("E12").values = [["Không áp dụng ngưỡng 10-20% theo yêu cầu"]];
metadata.getRange("A17:D21").clear({ applyTo: "contents" });
metadata.getRange("A17:D17").values = [[
  "ChatGPT/Codex",
  "Phân tích SRS, thiết kế giải pháp, triển khai, debug và verification",
  "High",
  "Phân tích đa bước và kiểm chứng với code/test"
]];
metadata.getRange("B24").formulas = [["=COUNTIF('2. Detailed Audit Log'!$C$4:$C$60,A24)"]];
metadata.getRange("B25").formulas = [["=COUNTIF('2. Detailed Audit Log'!$C$4:$C$60,A25)"]];
metadata.getRange("B26").formulas = [["=COUNTIF('2. Detailed Audit Log'!$C$4:$C$60,A26)"]];
metadata.getRange("B27").formulas = [["=COUNTIF('2. Detailed Audit Log'!$C$4:$C$60,A27)"]];
metadata.getRange("C24:C27").values = [["≥ 1"], ["≥ 1"], ["≥ 1"], ["≥ 1"]];

const detail = workbook.worksheets.getItem("2. Detailed Audit Log");
detail.getRange("A4:H100").clear({ applyTo: "contents" });
for (let row = 5; row <= 3 + entries.length; row += 1) {
  detail.getRange("A4:H4").copyTo(detail.getRange(`A${row}:H${row}`), "all");
}
const detailValues = entries.map((entry, index) => [
  String(index + 1).padStart(3, "0"),
  entry.type,
  entry.component,
  entry.context,
  entry.prompt,
  entry.response,
  entry.reflection,
  entry.evidence
]);
detail.getRange(`A4:H${3 + entries.length}`).values = detailValues;
detail.getRange(`A4:H${3 + entries.length}`).format.wrapText = true;
detail.getRange(`A4:H${3 + entries.length}`).format.verticalAlignment = "top";
detail.getRange(`A4:H${3 + entries.length}`).format.font = { name: "Calibri", size: 9 };
detail.getRange(`A4:H${3 + entries.length}`).format.borders = { preset: "all", style: "thin", color: "#C9CED6" };
detail.getRange(`A4:H${3 + entries.length}`).format.rowHeightPx = 172;
detail.getRange("A:A").format.columnWidth = 9;
detail.getRange("B:B").format.columnWidth = 18;
detail.getRange("C:C").format.columnWidth = 22;
detail.getRange("D:D").format.columnWidth = 34;
detail.getRange("E:E").format.columnWidth = 62;
detail.getRange("F:F").format.columnWidth = 43;
detail.getRange("G:G").format.columnWidth = 62;
detail.getRange("H:H").format.columnWidth = 43;
detail.freezePanes.freezeRows(3);

const hallucination = workbook.worksheets.getItem("3. Hallucination Detection");
hallucination.getRange("A4:F29").clear({ applyTo: "contents" });
for (let row = 5; row <= 3 + hallucinations.length; row += 1) {
  hallucination.getRange("A4:F4").copyTo(hallucination.getRange(`A${row}:F${row}`), "all");
}
hallucination.getRange(`A4:F${3 + hallucinations.length}`).values = hallucinations;
hallucination.getRange(`A4:F${3 + hallucinations.length}`).format.wrapText = true;
hallucination.getRange(`A4:F${3 + hallucinations.length}`).format.verticalAlignment = "top";
hallucination.getRange(`A4:F${3 + hallucinations.length}`).format.font = { name: "Calibri", size: 9 };
hallucination.getRange(`A4:F${3 + hallucinations.length}`).format.borders = { preset: "all", style: "thin", color: "#C9CED6" };
hallucination.getRange(`A4:F${3 + hallucinations.length}`).format.rowHeightPx = 140;
hallucination.freezePanes.freezeRows(3);

const checklist = workbook.worksheets.getItem("4. Self-Assessment Checklist");
checklist.getRange("C6:C10").values = [["☒"], ["☒"], ["☒"], ["☒"], ["☒"]];
checklist.getRange("D6:D10").values = [
  ["Các entry đều gắn với quyết định hoặc lỗi ảnh hưởng luồng Bee Academy."],
  ["Các prompt làm thay đổi architecture, rule nghiệp vụ hoặc cách verification."],
  ["Mỗi entry nêu rõ phần AI đúng/sai và lý do giữ hoặc sửa."],
  ["30/30 entry có commit, file, tài liệu hoặc kết quả test làm evidence."],
  ["Human Delta ghi rõ phần đánh giá và quyết định của người học."]
];
checklist.getRange("C14:C18").values = [["☒"], ["☒"], ["☒"], ["☒"], ["☒"]];
checklist.getRange("D14:D18").values = [
  [`${entries.length} entries theo phạm vi toàn bộ prompt Bee Academy đã tổng hợp.`],
  ["Decomposition 7; Pattern Recognition 8; Abstraction 7; Algorithms 8."],
  [`${hallucinations.length} cases có reality check và corrective action.`],
  ["30/30 entry có đủ Critical Thinking, Contextualization, Creative Synthesis, Decision Ownership."],
  ["30/30 entry có evidence (100%)."]
];
checklist.getRange("A28:D30").values = [
  ["001, 002, 003", "Có thể giải thích cách thu hẹp phạm vi và chuẩn hóa mô hình PayOS/payout/parent/reward.", "Có - AI đề xuất nhiều use case, người học loại phần vượt phạm vi.", "SRS 4.15, SRS code review, prompt gốc."],
  ["009, 010, 011", "Có thể giải thích đồng bộ video, chống tua và ghi chú timestamp.", "Có - nhớ các lỗi iframe onEnded và native timeline.", "Commits 71313f9, f733d51, f27cf40; tests/build."],
  ["017, 019, 020", "Có thể giải thích best-score reward và điều kiện chứng chỉ bốn bài theo version.", "Có - đã bác bỏ payment-based reward và final-only certificate.", "Commits e96df8d, d89fbb2; migrations V027/V028/V043; tests."]
];
checklist.getRange("B28:D30").format.wrapText = true;
checklist.getRange("A28:D30").format.rowHeightPx = 105;

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 200 },
  summary: "pre-export formula error scan"
});
console.log(errors.ndjson);

const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);
console.log(outputPath);
