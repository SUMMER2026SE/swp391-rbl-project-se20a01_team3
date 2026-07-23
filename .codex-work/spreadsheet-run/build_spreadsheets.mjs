import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const ROOT = path.resolve(process.cwd(), "COPS");
const OUT = `${ROOT}/output`;

const requirements = [
  ["REQ-AUTH-001","Đăng ký tài khoản","Authentication & Account","Guest","/register"],
  ["REQ-AUTH-002","Đăng nhập hệ thống","Authentication & Account","User","/login"],
  ["REQ-AUTH-003","Đăng xuất hệ thống","Authentication & Account","User","Header / Sidebar"],
  ["REQ-AUTH-004","Quên mật khẩu","Authentication & Account","User","/forgot-password"],
  ["REQ-AUTH-005","Cập nhật hồ sơ cá nhân","Authentication & Account","User","/student/profile; /teacher/profile"],
  ["REQ-CRS-001","Tìm kiếm khóa học","Search & Course","Guest/Student","/courses"],
  ["REQ-CRS-002","Xem chi tiết khóa học","Search & Course","Guest/Student","/courses/:id"],
  ["REQ-CRS-003","Xem bài học thử","Search & Course","Guest","/courses/:id (tab Nội dung học)"],
  ["REQ-PAY-001","Mua khóa học","Purchase & Payment","Student","/checkout"],
  ["REQ-PAY-002","Thanh toán khóa học","Purchase & Payment","Student","/checkout; /payment-result"],
  ["REQ-PAY-003","Xem lịch sử mua khóa học","Purchase & Payment","Student","/student/orders"],
  ["REQ-PAY-004","Gửi khiếu nại đến Admin","Purchase & Payment","Student","/student/complaints"],
  ["REQ-LRN-001","Xem danh sách khóa học đã mua","Learning","Student","/student/courses"],
  ["REQ-LRN-002","Xem bài giảng và tài liệu","Learning","Student","/student/courses/:id"],
  ["REQ-LRN-003","Tải tài liệu học tập","Learning","Student","/student/courses/:id"],
  ["REQ-LRN-004","Nộp bài tập","Learning","Student","/student/courses/:id"],
  ["REQ-LRN-005","Làm bài kiểm tra","Learning","Student","/student/courses/:courseId/exams/:slotIndex"],
  ["REQ-LRN-006","Xem điểm và tiến độ học tập","Learning","Student","/student/progress"],
  ["REQ-LRN-007","Đánh giá khóa học","Learning","Student","/student/courses/:id"],
  ["REQ-LRN-008","Xem và tải chứng chỉ","Learning","Student","/student/certificates"],
  ["REQ-INT-001","Gửi câu hỏi cho giáo viên","Interaction & Support","Student","/student/qa"],
  ["REQ-INT-002","Chat AI hỗ trợ","Interaction & Support","Student","/student/ai-tutor"],
  ["REQ-INT-003","Nhận đề xuất lộ trình từ AI","Interaction & Support","Student","/student/ai-tutor"],
  ["REQ-PRN-001","Theo dõi tiến độ học tập của con","Parent","Parent","/parent/progress"],
  ["REQ-PRN-002","Liên hệ và nhận thông báo từ giáo viên","Parent","Parent","/parent/messages"],
  ["REQ-PRN-003","Xem lịch sử thanh toán khóa học","Parent","Parent","/parent/payments"],
  ["REQ-PRN-004","Gửi lời mời liên kết con","Parent","Parent","/parent/link"],
  ["REQ-PRN-005","Chấp nhận hoặc từ chối liên kết","Parent","Student","/student/account"],
  ["REQ-PRN-006","Hủy liên kết tài khoản","Parent","Parent/Student","/parent/link; /student/account"],
  ["REQ-TCH-001","Tạo khóa học mới","Teacher","Teacher","/teacher/courses"],
  ["REQ-TCH-002","Cập nhật bài giảng và tài liệu","Teacher","Teacher","/teacher/content"],
  ["REQ-TCH-003","Tạo bài kiểm tra","Teacher","Teacher","/teacher/exam"],
  ["REQ-TCH-004","Tạo question bank","Teacher","Teacher","/teacher/questions"],
  ["REQ-TCH-005","Cập nhật question bank","Teacher","Teacher","/teacher/questions"],
  ["REQ-TCH-006","Chấm điểm bài tập và câu tự luận","Teacher","Teacher","/teacher/grades"],
  ["REQ-TCH-007","Trả lời câu hỏi học sinh","Teacher","Teacher","/teacher/qa"],
  ["REQ-TCH-008","Xem lịch sử doanh thu","Teacher","Teacher","/teacher/revenue"],
  ["REQ-ADM-001","Xem dashboard quản trị","Admin","Admin","/admin"],
  ["REQ-ADM-002","Xem danh sách tài khoản người dùng","Admin","Admin","/admin/users"],
  ["REQ-ADM-003","Cập nhật tài khoản người dùng","Admin","Admin","/admin/users"],
  ["REQ-ADM-004","Duyệt khóa học","Admin","Admin","/admin/approvals"],
  ["REQ-ADM-005","Xử lý khiếu nại từ người dùng","Admin","Admin","/admin/complaints"],
  ["REQ-ADM-006","Xuất danh sách chi trả và xác nhận chuyển khoản giáo viên","Admin","Admin","/admin/payouts"],
  ["REQ-ADM-007","Gửi thông báo đến người dùng","Admin","Admin","/admin/notifications"],
];

const retest = {
  "REQ-AUTH-001": ["Có", "Một phần", "PARTIAL", "Biểu mẫu đăng ký mở được; không tạo tài khoản hoặc gửi OTP/email thật trong phiên kiểm thử."],
  "REQ-AUTH-002": ["Có", "Có", "PASSED", "Đăng nhập thành công bằng cả 4 tài khoản Student, Parent, Teacher và Admin; điều hướng đúng dashboard theo vai trò."],
  "REQ-AUTH-003": ["Có", "Có", "FAILED", "Đăng xuất hoạt động ở một số màn hình nhưng không phản hồi trên trang con Giáo viên và Admin; lỗi tái hiện sau hai lần bấm."],
  "REQ-AUTH-004": ["Có", "Một phần", "PARTIAL", "Biểu mẫu quên mật khẩu mở được; không gửi OTP/email thật nên chưa xác minh bước hoàn tất."],
  "REQ-AUTH-005": ["Có", "Một phần", "PARTIAL", "Màn hình hồ sơ Student và Teacher cùng nút Lưu hiển thị; không ghi thay đổi dữ liệu trong phiên kiểm thử."],
  "REQ-CRS-001": ["Có", "Có", "PASSED", "Đã kiểm tra tìm kiếm khóa học trên UI local và có ảnh minh chứng."],
  "REQ-CRS-002": ["Có", "Có", "PASSED", "Đã kiểm tra trang chi tiết khóa học trên UI local và có ảnh minh chứng."],
  "REQ-CRS-003": ["Có", "Không", "BLOCKED", "Mục lục hiển thị nhưng dữ liệu hiện tại không có bài học miễn phí; khóa học yêu cầu mua."],
  "REQ-PAY-001": ["Có", "Không", "BLOCKED", "Giỏ hàng của tài khoản Student đang trống; chưa có khóa học được chọn để hoàn tất luồng mua."],
  "REQ-PAY-002": ["Có", "Không", "BLOCKED", "Không thực hiện thanh toán thật; chưa có đơn hàng hoặc payment-result hợp lệ để kiểm tra."],
  "REQ-PAY-003": ["Có", "Có", "PASSED", "Trang lịch sử mua hàng tải thành công và hiển thị đúng empty state: 0 đơn hàng."],
  "REQ-PAY-004": ["Có", "Một phần", "PARTIAL", "Trang Khiếu nại và nút Tạo khiếu nại mới hiển thị; không gửi khiếu nại thử để tránh tạo dữ liệu."],
  "REQ-LRN-001": ["Có", "Có", "PASSED", "Trang Khóa học của tôi tải thành công và hiển thị đúng empty state cho tài khoản chưa mua khóa học."],
  "REQ-LRN-002": ["Có", "Không", "BLOCKED", "Tài khoản Student chưa sở hữu khóa học nên chưa truy cập được bài giảng đã mua."],
  "REQ-LRN-003": ["Có", "Không", "BLOCKED", "Không có khóa học đã mua và không có tài liệu đủ điều kiện tải."],
  "REQ-LRN-004": ["Có", "Không", "BLOCKED", "Không có khóa học/bài tập đã mua để nộp bài."],
  "REQ-LRN-005": ["Có", "Không", "BLOCKED", "Không có khóa học và exam slot hợp lệ cho tài khoản Student."],
  "REQ-LRN-006": ["Có", "Không", "BLOCKED", "Không có dữ liệu học tập đã mua để xác minh điểm và tiến độ."],
  "REQ-LRN-007": ["Có", "Không", "BLOCKED", "Không có khóa học đã mua/hoàn thành để đánh giá."],
  "REQ-LRN-008": ["Có", "Một phần", "PARTIAL", "Trang Chứng chỉ tải thành công và hiển thị điều kiện cấp; tài khoản chưa có chứng chỉ để tải."],
  "REQ-INT-001": ["Có", "Một phần", "PARTIAL", "Trang Hỏi & Đáp và nút Đặt câu hỏi hiển thị; chưa gửi câu hỏi thử."],
  "REQ-INT-002": ["Có", "Một phần", "PARTIAL", "Trang Trợ lý AI và các gợi ý hội thoại hiển thị; không gọi dịch vụ AI ngoài trong phiên kiểm thử."],
  "REQ-INT-003": ["Có", "Một phần", "PARTIAL", "Tab Lộ trình học hiển thị; không gọi dịch vụ AI ngoài để sinh lộ trình."],
  "REQ-PRN-001": ["Có", "Không", "BLOCKED", "Trang tiến độ mở được nhưng tài khoản Parent chưa liên kết học sinh."],
  "REQ-PRN-002": ["Có", "Không", "BLOCKED", "Trang tin nhắn mở được nhưng tài khoản Parent chưa liên kết học sinh."],
  "REQ-PRN-003": ["Có", "Không", "BLOCKED", "Trang lịch sử thanh toán mở được nhưng chưa có tài khoản con được liên kết."],
  "REQ-PRN-004": ["Có", "Một phần", "PARTIAL", "Biểu mẫu mời liên kết, lựa chọn quan hệ và nút Gửi lời mời hiển thị; không gửi email thật."],
  "REQ-PRN-005": ["Có", "Không", "BLOCKED", "Chưa có lời mời PENDING để Student chấp nhận hoặc từ chối."],
  "REQ-PRN-006": ["Có", "Không", "BLOCKED", "Chưa có liên kết Parent-Student để kiểm tra hủy liên kết."],
  "REQ-TCH-001": ["Có", "Một phần", "PARTIAL", "Mở được biểu mẫu Tạo khóa học với đầy đủ trường bắt buộc; không tạo bản ghi thử."],
  "REQ-TCH-002": ["Có", "Không", "BLOCKED", "Trang Bài giảng mở được nhưng Teacher hiện có 0 khóa học để cập nhật."],
  "REQ-TCH-003": ["Có", "Không", "BLOCKED", "Trang Bài kiểm tra mở được nhưng chưa có khóa học/vị trí đề."],
  "REQ-TCH-004": ["Có", "Một phần", "PARTIAL", "Trang Ngân hàng câu hỏi và các nút Tạo bank/Import hiển thị; chưa tạo bank thử."],
  "REQ-TCH-005": ["Có", "Không", "BLOCKED", "Teacher chưa có question bank để cập nhật."],
  "REQ-TCH-006": ["Có", "Không", "BLOCKED", "Trang Chấm tự luận mở được nhưng có 0 lượt nộp."],
  "REQ-TCH-007": ["Có", "Không", "BLOCKED", "Trang Hỏi & Đáp mở được nhưng không có câu hỏi để trả lời."],
  "REQ-TCH-008": ["Có", "Có", "PASSED", "Trang Doanh thu tải thành công, hiển thị đúng số liệu 0 và empty state giao dịch."],
  "REQ-ADM-001": ["Có", "Có", "PASSED", "Dashboard Admin tải thành công và hiển thị KPI, bảng, biểu đồ/empty state."],
  "REQ-ADM-002": ["Có", "Có", "PASSED", "Danh sách tài khoản tải thành công, hiển thị người dùng, vai trò và trạng thái."],
  "REQ-ADM-003": ["Có", "Một phần", "PARTIAL", "Các hành động khóa tài khoản/cấp lại mật khẩu hiển thị; không thực thi vì làm thay đổi quyền truy cập."],
  "REQ-ADM-004": ["Có", "Một phần", "PARTIAL", "Trang Duyệt khóa học tải thành công nhưng hiện có 0 khóa chờ duyệt."],
  "REQ-ADM-005": ["Có", "Một phần", "PARTIAL", "Trang Xử lý khiếu nại tải thành công nhưng không có khiếu nại thử để xử lý."],
  "REQ-ADM-006": ["Có", "Có", "FAILED", "Trang chi trả hiển thị dữ liệu PENDING; nút Xuất báo cáo Excel không phát sinh file tải xuống trong 10 giây. Không bấm Xác nhận chuyển."],
  "REQ-ADM-007": ["Có", "Một phần", "PARTIAL", "Biểu mẫu phát thông báo và lịch sử hiển thị; không gửi thông báo thật."],
};

function statusFor(id) {
  return retest[id];
}

const coverageRows = requirements.map(r => [...r, ...statusFor(r[0])]);

let screenshots = [
  ["IMG-001","REQ-CRS-001","Guest","Tìm kiếm khóa học",1,"button[name='Xem Khóa Học']","Nút mở danh sách khóa học","output/screenshots-original/guest/REQ-CRS-001/step-01-open-course-list-original.png","output/screenshots/guest/REQ-CRS-001/step-01-open-course-list-highlighted.png","Bee Academy - Nền Tảng Học Tập Trực Tuyến","Có","Có","Ảnh UI local 1440×900."],
  ["IMG-002","REQ-CRS-001","Guest","Tìm kiếm khóa học",2,"input[placeholder='Tìm kiếm khóa học, môn học, giảng viên...']","Ô tìm kiếm khóa học","output/screenshots-original/guest/REQ-CRS-001/step-02-search-course-original.png","output/screenshots/guest/REQ-CRS-001/step-02-search-course-highlighted.png","Bee Academy - Nền Tảng Học Tập Trực Tuyến","Có","Có","Danh sách trả về 1 khóa học."],
  ["IMG-003","REQ-CRS-002","Guest","Xem chi tiết khóa học",1,"a[href='/courses/45ca639b-cb42-4501-be58-ee40f33900e7'] h3","Thẻ khóa học Công Nghệ 6","output/screenshots-original/guest/REQ-CRS-002/step-01-select-course-original.png","output/screenshots/guest/REQ-CRS-002/step-01-select-course-highlighted.png","Bee Academy - Nền Tảng Học Tập Trực Tuyến","Có","Có","Dữ liệu khóa học thực từ backend local."],
  ["IMG-004","REQ-CRS-002","Guest","Xem chi tiết khóa học",2,"h1","Tiêu đề trang chi tiết khóa học","output/screenshots-original/guest/REQ-CRS-002/step-02-view-course-details-original.png","output/screenshots/guest/REQ-CRS-002/step-02-view-course-details-highlighted.png","Bee Academy - Nền Tảng Học Tập Trực Tuyến","Có","Có","Trang chi tiết hiển thị 4 chương và 18 bài."],
  ["IMG-005","REQ-CRS-003","Guest","Xem bài học thử",1,"button[name='Nội dung học']","Tab Nội dung học","output/screenshots-original/guest/REQ-CRS-003/step-01-open-course-content-original.png","output/screenshots/guest/REQ-CRS-003/step-01-open-course-content-highlighted.png","Bee Academy - Nền Tảng Học Tập Trực Tuyến","Có","Có","Không có bài học thử mở trong dữ liệu hiện tại; requirement bị BLOCKED."],
  ["IMG-006","REQ-AUTH-001","Guest","Đăng ký tài khoản",1,"form","Nhóm trường đăng ký","output/screenshots-original/guest/REQ-AUTH-001/step-01-open-register-form-original.png","output/screenshots/guest/REQ-AUTH-001/step-01-open-register-form-highlighted.png","Bee Academy - Nền Tảng Học Tập Trực Tuyến","Có","Có","Chỉ xác minh giao diện; không gửi OTP thật."],
  ["IMG-007","REQ-AUTH-002","User","Đăng nhập hệ thống",1,"form","Biểu mẫu đăng nhập","output/screenshots-original/user/REQ-AUTH-002/step-01-enter-credentials-original.png","output/screenshots/user/REQ-AUTH-002/step-01-enter-credentials-highlighted.png","Bee Academy - Nền Tảng Học Tập Trực Tuyến","Có","Có","Tài khoản kiểm thử; mật khẩu được che trên UI."],
  ["IMG-008","REQ-AUTH-002","User","Đăng nhập hệ thống",2,"button[name='Đăng Nhập']","Nút Đăng Nhập","output/screenshots-original/user/REQ-AUTH-002/step-02-submit-login-original.png","output/screenshots/user/REQ-AUTH-002/step-02-submit-login-highlighted.png","Bee Academy - Nền Tảng Học Tập Trực Tuyến","Có","Có","Ảnh lưu lần chạy đầu; retest ngày 22/07/2026 xác nhận cả 4 tài khoản đăng nhập thành công."],
  ["IMG-009","REQ-AUTH-004","User","Quên mật khẩu",1,"form","Biểu mẫu nhận OTP","output/screenshots-original/user/REQ-AUTH-004/step-01-open-forgot-password-original.png","output/screenshots/user/REQ-AUTH-004/step-01-open-forgot-password-highlighted.png","Bee Academy - Nền Tảng Học Tập Trực Tuyến","Có","Có","Không gửi OTP thật."],
];

function styleSheet(sheet, title, headers, rows, widths) {
  sheet.showGridLines = false;
  const titleEndCol = String.fromCharCode(64 + headers.length);
  sheet.getRange(`A1:${titleEndCol}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${titleEndCol}1`).format = {fill:"#C00000",font:{bold:true,color:"#FFFFFF",size:16},horizontalAlignment:"center",verticalAlignment:"center"};
  sheet.getRange(`A1:${titleEndCol}1`).format.rowHeight = 30;
  const headerRow = 4;
  const endCol = String.fromCharCode(64 + headers.length);
  sheet.getRange(`A${headerRow}:${endCol}${headerRow}`).values = [headers];
  sheet.getRange(`A${headerRow}:${endCol}${headerRow}`).format = {fill:"#F4CCCC",font:{bold:true,color:"#1F1F1F"},wrapText:true,verticalAlignment:"center",borders:{preset:"all",style:"thin",color:"#B7B7B7"}};
  sheet.getRange(`A${headerRow+1}:${endCol}${headerRow+rows.length}`).values = rows;
  sheet.getRange(`A${headerRow+1}:${endCol}${headerRow+rows.length}`).format = {wrapText:true,verticalAlignment:"top",borders:{preset:"all",style:"thin",color:"#D9D9D9"}};
  widths.forEach((w,i)=>sheet.getRangeByIndexes(0,i,headerRow+rows.length,1).format.columnWidth=w);
  sheet.getRange(`A${headerRow}:${endCol}${headerRow+rows.length}`).format.autofitRows();
  sheet.freezePanes.freezeRows(headerRow);
}

async function saveCoverage() {
  const wb=Workbook.create(); const s=wb.worksheets.add("Coverage Matrix");
  styleSheet(s,"BEE ACADEMY - FEATURE COVERAGE MATRIX",["REQ ID","Tên chức năng","Module","Actor","UI route dự kiến","Đã triển khai","Có thể kiểm thử","Trạng thái tài liệu","Ghi chú"],coverageRows,[18,30,24,18,35,14,16,18,55]);
  s.getRange("A2").values=[["Tổng REQ"]];s.getRange("B2").formulas=[["=COUNTA(A5:A48)"]];
  s.getRange("C2").values=[["Passed"]];s.getRange("D2").formulas=[["=COUNTIF(H5:H48,\"PASSED\")"]];
  s.getRange("E2").values=[["Partial"]];s.getRange("F2").formulas=[["=COUNTIF(H5:H48,\"PARTIAL\")"]];
  s.getRange("G2").values=[["Blocked"]];s.getRange("H2").formulas=[["=COUNTIF(H5:H48,\"BLOCKED\")"]];
  s.getRange("A3").values=[["Failed"]];s.getRange("B3").formulas=[["=COUNTIF(H5:H48,\"FAILED\")"]];
  s.getRange("A2:H3").format={fill:"#FCE8E6",font:{bold:true,color:"#7F0000"}};
  s.getRange("H5:H48").conditionalFormats.addCustom('=H5="PASSED"',{fill:"#D9EAD3",font:{color:"#274E13",bold:true}});
  s.getRange("H5:H48").conditionalFormats.addCustom('=H5="PARTIAL"',{fill:"#FFF2CC",font:{color:"#7F6000",bold:true}});
  s.getRange("H5:H48").conditionalFormats.addCustom('=H5="BLOCKED"',{fill:"#FCE5CD",font:{color:"#783F04",bold:true}});
  s.getRange("H5:H48").conditionalFormats.addCustom('=H5="FAILED"',{fill:"#F4CCCC",font:{color:"#990000",bold:true}});
  const preview=await wb.render({sheetName:"Coverage Matrix",range:"A1:I48",scale:1,format:"png"});await fs.writeFile(`${ROOT}/qa/coverage-preview.png`,new Uint8Array(await preview.arrayBuffer()));
  const out=await SpreadsheetFile.exportXlsx(wb);await out.save(`${OUT}/feature_coverage_matrix.xlsx`);
  return wb;
}

async function saveManifest() {
  const wb=Workbook.create();const s=wb.worksheets.add("Screenshot Manifest");
  const headers=["Image ID","REQ ID","Role","Function","Step","Target selector","Target description","Original file","Highlighted file","Page title","Captured successfully","Highlight validated","Notes"];
  s.showGridLines=false;s.getRange("A1:M1").merge();s.getRange("A1").values=[["BEE ACADEMY - SCREENSHOT MANIFEST"]];s.getRange("A1:M1").format={fill:"#C00000",font:{bold:true,color:"#FFFFFF",size:16},horizontalAlignment:"center"};
  s.getRange("A3:M3").values=[headers];s.getRange("A3:M3").format={fill:"#F4CCCC",font:{bold:true},wrapText:true,borders:{preset:"all",style:"thin",color:"#B7B7B7"}};
  s.getRange(`A4:M${3+screenshots.length}`).values=screenshots;s.getRange(`A4:M${3+screenshots.length}`).format={wrapText:true,verticalAlignment:"top",borders:{preset:"all",style:"thin",color:"#D9D9D9"}};
  [14,18,12,26,8,34,30,48,48,28,16,16,44].forEach((w,i)=>s.getRangeByIndexes(0,i,3+screenshots.length,1).format.columnWidth=w);s.getRange(`A3:M${3+screenshots.length}`).format.autofitRows();s.freezePanes.freezeRows(3);
  const preview=await wb.render({sheetName:"Screenshot Manifest",range:"A1:M12",scale:1,format:"png"});await fs.writeFile(`${ROOT}/qa/manifest-preview.png`,new Uint8Array(await preview.arrayBuffer()));
  const out=await SpreadsheetFile.exportXlsx(wb);await out.save(`${OUT}/screenshot_manifest.xlsx`);return wb;
}

async function saveUnimplemented() {
  const blocked=coverageRows.filter(r=>r[7]!=="PASSED").map(r=>[r[0],r[1],r[7],r[8],r[4],r[0]==="REQ-CRS-003"?"Bổ sung ít nhất một lesson isFree và kiểm thử lại.":r[7]==="FAILED"?"Sửa lỗi đã tái hiện và chạy regression test.":r[7]==="PARTIAL"?"Chuẩn bị dữ liệu test kiểm soát và hoàn tất happy path.":"Chuẩn bị dữ liệu/điều kiện tiên quyết theo vai trò rồi kiểm thử lại."]);
  const wb=Workbook.create();const s=wb.worksheets.add("Chưa xác minh");
  styleSheet(s,"BEE ACADEMY - CHỨC NĂNG CHƯA THỂ XÁC MINH",["REQ ID","Chức năng","Trạng thái","Lý do/Evidence","Route","Hành động đề xuất"],blocked,[18,34,16,60,38,55]);
  const preview=await wb.render({sheetName:"Chưa xác minh",range:`A1:F${4+blocked.length}`,scale:1,format:"png"});await fs.writeFile(`${ROOT}/qa/unimplemented-preview.png`,new Uint8Array(await preview.arrayBuffer()));
  const out=await SpreadsheetFile.exportXlsx(wb);await out.save(`${OUT}/unimplemented_functions.xlsx`);return wb;
}

await fs.mkdir(OUT,{recursive:true});
screenshots = JSON.parse(await fs.readFile(`${ROOT}/analysis/screenshots.json`, "utf8"));
await fs.writeFile(`${ROOT}/analysis/requirements.json`, JSON.stringify(coverageRows, null, 2), "utf8");
await fs.writeFile(`${ROOT}/analysis/screenshots.json`, JSON.stringify(screenshots, null, 2), "utf8");
const coverageWb=await saveCoverage();const manifestWb=await saveManifest();const unimplementedWb=await saveUnimplemented();
for (const [name,wb,range] of [["coverage",coverageWb,"A1:I12"],["manifest",manifestWb,"A1:M12"],["unimplemented",unimplementedWb,"A1:F12"]]) {
  const check=await wb.inspect({kind:"table",range,include:"values,formulas",tableMaxRows:12,tableMaxCols:13});console.log(name,check.ndjson);
  const errors=await wb.inspect({kind:"match",searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",options:{useRegex:true,maxResults:50},summary:"final formula error scan"});console.log(name,"errors",errors.ndjson);
}
