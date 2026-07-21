from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


OUT = Path(r"E:\swp391-rbl-project-se20a01_team3\.codex-work\extension_uml")
OUT.mkdir(parents=True, exist_ok=True)

FONT_REGULAR = r"C:\Windows\Fonts\arial.ttf"
FONT_BOLD = r"C:\Windows\Fonts\arialbd.ttf"
FONT_ITALIC = r"C:\Windows\Fonts\ariali.ttf"

COLORS = {
    "ink": "#172033",
    "muted": "#536178",
    "line": "#67758B",
    "grid": "#C9D2DF",
    "boundary": "#DCEEFF",
    "boundary_header": "#73A9E6",
    "control": "#DDF4E4",
    "control_header": "#72BC83",
    "entity": "#FFF0CD",
    "entity_header": "#E9B95D",
    "repo": "#EEE4FF",
    "repo_header": "#9D7BD8",
    "external": "#E8EDF3",
    "external_header": "#8997AA",
    "note": "#FFF9D9",
    "note_border": "#C5A84A",
    "white": "#FFFFFF",
}


def font(size: int, bold: bool = False, italic: bool = False):
    path = FONT_BOLD if bold else FONT_ITALIC if italic else FONT_REGULAR
    return ImageFont.truetype(path, size=size)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if draw.textlength(candidate, font=fnt) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def rounded_box(draw, rect, fill, outline="#506079", width=3, radius=14):
    draw.rounded_rectangle(rect, radius=radius, fill=fill, outline=outline, width=width)


def card(draw, x, y, w, title, stereotype, lines, kind="control", min_h=0):
    title_font = font(26, bold=True)
    stereo_font = font(19, italic=True)
    body_font = font(20)
    header_h = 76
    body_lines: list[str] = []
    for line in lines:
        body_lines.extend(wrap_text(draw, line, body_font, w - 34))
    h = max(min_h, header_h + 18 + len(body_lines) * 27 + 16)
    fill = COLORS[kind]
    head = COLORS[f"{kind}_header"]
    rounded_box(draw, (x, y, x + w, y + h), fill=fill)
    draw.rounded_rectangle((x, y, x + w, y + header_h), radius=14, fill=head)
    draw.rectangle((x, y + header_h - 14, x + w, y + header_h), fill=head)
    draw.text((x + 16, y + 10), f"«{stereotype}»", font=stereo_font, fill=COLORS["ink"])
    draw.text((x + 16, y + 34), title, font=title_font, fill=COLORS["ink"])
    cy = y + header_h + 12
    for line in body_lines:
        draw.text((x + 16, cy), line, font=body_font, fill=COLORS["ink"])
        cy += 27
    return (x, y, x + w, y + h)


def point_on(rect, side):
    x1, y1, x2, y2 = rect
    if side == "left": return (x1, (y1 + y2) // 2)
    if side == "right": return (x2, (y1 + y2) // 2)
    if side == "top": return ((x1 + x2) // 2, y1)
    return ((x1 + x2) // 2, y2)


def arrow(draw, start, end, label=None, dashed=False, color=None, label_offset=(0, -28)):
    color = color or COLORS["line"]
    x1, y1 = start
    x2, y2 = end
    if dashed:
        segments = 14
        for i in range(0, segments, 2):
            a = i / segments
            b = min((i + 1) / segments, 1)
            draw.line((x1 + (x2-x1)*a, y1 + (y2-y1)*a,
                       x1 + (x2-x1)*b, y1 + (y2-y1)*b), fill=color, width=3)
    else:
        draw.line((x1, y1, x2, y2), fill=color, width=3)
    import math
    ang = math.atan2(y2-y1, x2-x1)
    size = 15
    for delta in (2.65, -2.65):
        draw.line((x2, y2, x2 + size*math.cos(ang+delta), y2 + size*math.sin(ang+delta)), fill=color, width=3)
    if label:
        fnt = font(18)
        mx = (x1 + x2) / 2 + label_offset[0]
        my = (y1 + y2) / 2 + label_offset[1]
        lines = wrap_text(draw, label, fnt, 420)
        tw = max(draw.textlength(line, font=fnt) for line in lines)
        th = len(lines) * 22
        draw.rounded_rectangle((mx - tw/2 - 7, my - 4, mx + tw/2 + 7, my + th), radius=5, fill=COLORS["white"])
        for i, line in enumerate(lines):
            draw.text((mx - draw.textlength(line, font=fnt)/2, my + i*22), line, font=fnt, fill=COLORS["ink"])


def title(draw, text):
    fnt = font(34, bold=True)
    draw.text((1200, 36), text, font=fnt, fill=COLORS["ink"], anchor="ma")
    draw.line((70, 82, 2330, 82), fill="#B7C3D3", width=3)


def group(draw, rect, label, fill="#F7F9FC"):
    draw.rounded_rectangle(rect, radius=18, fill=fill, outline="#AAB7C8", width=3)
    draw.text((rect[0] + 18, rect[1] + 10), label, font=font(22, bold=True), fill=COLORS["muted"])


def note(draw, rect, text):
    rounded_box(draw, rect, COLORS["note"], COLORS["note_border"], width=3, radius=12)
    fnt = font(21)
    y = rect[1] + 14
    for line in wrap_text(draw, text, fnt, rect[2]-rect[0]-28):
        draw.text((rect[0]+14, y), line, font=fnt, fill=COLORS["ink"])
        y += 27


def class_uc45():
    im = Image.new("RGB", (2400, 1550), COLORS["white"]); d = ImageDraw.Draw(im)
    title(d, "UC45 - Tích điểm từ kết quả bài kiểm tra - UML Class Diagram")
    group(d, (50, 105, 730, 1030), "Assessment services")
    group(d, (760, 105, 1520, 1030), "Reward domain service")
    group(d, (1550, 105, 2350, 1030), "Persistence and model")
    quiz = card(d, 90, 165, 600, "QuizService", "Service", [
        "+submitAttempt(...): QuizResultResponse",
        "tính score theo thang 10, gửi score × 10"
    ], "boundary")
    exam = card(d, 90, 500, 600, "ExamService", "Service", [
        "+submitExam(...): SubmissionResponse",
        "+gradeAttempt(...): TeacherExamAttemptResponse",
        "gửi scorePercent sau khi có điểm"
    ], "boundary")
    reward = card(d, 805, 260, 670, "RewardService", "Service", [
        "+recordAssessmentScore(studentId, type, assessmentId, scorePercent): int",
        "-toRewardPoints(scorePercent): int",
        "-getOrCreateBalance(studentId): StudentRewardBalance"
    ], "control")
    source = card(d, 1590, 150, 720, "StudentRewardSource", "Entity", [
        "studentId, assessmentType, assessmentId",
        "bestScorePercent, awardedPoints",
        "+updateIfHigher(scorePercent, points): int"
    ], "entity")
    balance = card(d, 1590, 500, 720, "StudentRewardBalance", "Entity", [
        "studentId, availablePoints, lifetimePoints",
        "+addPoints(points): void",
        "+spendPoints(points): void"
    ], "entity")
    repos = card(d, 1590, 785, 720, "Reward repositories", "Repository", [
        "StudentRewardSourceRepository",
        "StudentRewardBalanceRepository",
        "find source theo student + type + assessment",
        "save source / balance"
    ], "repo")
    arrow(d, point_on(quiz, "right"), point_on(reward, "left"), "recordAssessmentScore(...)", label_offset=(0,-48))
    arrow(d, point_on(exam, "right"), point_on(reward, "left"), "recordAssessmentScore(...)", label_offset=(0,18))
    arrow(d, point_on(reward, "right"), point_on(source, "left"), "tạo/cập nhật kết quả tốt nhất", label_offset=(0,-42))
    arrow(d, point_on(reward, "right"), point_on(balance, "left"), "cộng delta điểm", label_offset=(0,12))
    arrow(d, point_on(reward, "bottom"), point_on(repos, "left"), "đọc và lưu", label_offset=(50,-18))
    note(d, (110, 1085, 2290, 1470),
         "Quy tắc nghiệp vụ đúng: điểm thưởng = round(scorePercent), giới hạn trong [0, 100]. "
         "Mỗi quiz/exam chỉ ghi nhận mức điểm cao nhất. Lần đầu cộng toàn bộ điểm; lần làm lại tốt hơn chỉ cộng phần chênh lệch; "
         "kết quả thấp hơn hoặc bằng không làm tăng ví điểm. Điểm phát sinh từ kết quả bài kiểm tra, không phát sinh từ việc hoàn thành khóa học.")
    im.save(OUT / "UC45_Class_Diagram.png", dpi=(300,300))


def class_uc46():
    im = Image.new("RGB", (2400, 1550), COLORS["white"]); d = ImageDraw.Draw(im)
    title(d, "UC46 - Đổi và sử dụng voucher giảm giá khóa học - UML Class Diagram")
    group(d, (45, 105, 670, 1110), "UI and API")
    group(d, (700, 105, 1430, 1110), "Application services")
    group(d, (1460, 105, 2355, 1110), "Reward and order model")
    ui = card(d, 85, 155, 545, "RewardsPage / CheckoutPage", "Boundary", [
        "+loadWallet()",
        "+redeemVoucher(voucherId)",
        "+createOrder(courseIds, rewardVoucherId)"
    ], "boundary")
    ctr = card(d, 85, 500, 545, "RewardController / OrderController", "RestController", [
        "GET /api/rewards/wallet",
        "POST /api/rewards/vouchers/{id}/redeem",
        "POST /api/orders"
    ], "boundary")
    reward = card(d, 745, 150, 640, "RewardService", "Service", [
        "+redeemVoucher(studentId, voucherId): RewardWalletResponse",
        "+reserveVoucherForOrder(...): AppliedRewardVoucher",
        "+markVoucherUsed(...): void",
        "+releaseVoucherReservation(...): void"
    ], "control")
    order = card(d, 745, 610, 640, "OrderService", "Service", [
        "+createOrder(me, request): OrderResponse",
        "+handlePayOSWebhook(orderCode): void",
        "+cancelOrder(orderId, userId): OrderResponse"
    ], "control")
    voucher = card(d, 1505, 145, 390, "RewardVoucher", "Entity", [
        "code, displayName",
        "requiredPoints",
        "discountAmount, active"
    ], "entity")
    owned = card(d, 1930, 145, 380, "StudentRewardVoucher", "Entity", [
        "studentId, voucher",
        "status, orderId",
        "redeemedAt, usedAt"
    ], "entity")
    balance = card(d, 1505, 500, 390, "StudentRewardBalance", "Entity", [
        "availablePoints",
        "lifetimePoints",
        "+spendPoints(points)"
    ], "entity")
    order_entity = card(d, 1930, 500, 380, "Order", "Entity", [
        "subtotalAmount",
        "rewardDiscountAmount",
        "rewardVoucherId",
        "totalAmount"
    ], "entity")
    repos = card(d, 1505, 830, 805, "RewardVoucher / Balance / StudentVoucher / Order repositories", "Repository", [
        "tải catalog và voucher của học sinh",
        "khóa trạng thái AVAILABLE → RESERVED → USED",
        "lưu số dư điểm và tổng tiền đơn hàng"
    ], "repo")
    arrow(d, point_on(ui,"bottom"), point_on(ctr,"top"), "HTTP request")
    arrow(d, point_on(ctr,"right"), point_on(reward,"left"), "wallet / redeem", label_offset=(0,-42))
    arrow(d, point_on(ctr,"right"), point_on(order,"left"), "create order", label_offset=(0,16))
    arrow(d, point_on(order,"top"), point_on(reward,"bottom"), "reserve / use / release voucher", label_offset=(0,-10))
    arrow(d, point_on(reward,"right"), point_on(voucher,"left"), "kiểm tra active + requiredPoints")
    arrow(d, point_on(reward,"right"), point_on(balance,"left"), "trừ điểm")
    arrow(d, point_on(reward,"right"), point_on(owned,"left"), "tạo và đổi trạng thái", label_offset=(0,22))
    arrow(d, point_on(order,"right"), point_on(order_entity,"left"), "applyRewardVoucher(...)" )
    arrow(d, point_on(reward,"bottom"), point_on(repos,"left"), "persist reward state", label_offset=(40,-28))
    arrow(d, point_on(order,"bottom"), point_on(repos,"left"), "persist order", label_offset=(30,12))
    note(d, (120, 1160, 2280, 1480),
         "Voucher là phần thưởng được đổi bằng availablePoints. Khi mua khóa học, discount = min(subtotalAmount, voucher.discountAmount), "
         "totalAmount = subtotalAmount - rewardDiscountAmount. Voucher được RESERVED trong lúc chờ thanh toán, chuyển USED khi đơn PAID; "
         "nếu hủy/thất bại thì reservation được giải phóng để học sinh dùng lại.")
    im.save(OUT / "UC46_Class_Diagram.png", dpi=(300,300))


def class_uc47():
    im = Image.new("RGB", (2400, 1550), COLORS["white"]); d = ImageDraw.Draw(im)
    title(d, "UC47 - Cấp và xác minh chứng chỉ - UML Class Diagram")
    group(d, (45, 105, 650, 1110), "UI and API")
    group(d, (680, 105, 1450, 1110), "Certificate services")
    group(d, (1480, 105, 2355, 1110), "Persistence and external storage")
    ui = card(d, 85, 150, 525, "CertificatesPage / CertificateVerifyPage", "Boundary", [
        "+requestCertificate(courseId)",
        "+view/download certificate",
        "+verifyCertificate(verificationCode)"
    ], "boundary")
    ctr = card(d, 85, 545, 525, "CertificateController", "RestController", [
        "POST /api/student/courses/{courseId}/certificate",
        "GET /api/student/certificates/{id}",
        "GET /api/certificates/verify/{code}"
    ], "boundary")
    service = card(d, 725, 145, 680, "CertificateService", "Service", [
        "+requestIssue(courseId, user): CertificateResponse",
        "+tryIssueAfterProgress(studentId, courseId): void",
        "+verify(code): CertificateVerificationResponse",
        "-issueIfEligible(...): Optional<Certificate>"
    ], "control")
    eligibility = card(d, 725, 650, 680, "CertificateEligibilityService", "Service", [
        "+evaluate(enrollment): Eligibility",
        "courseCompleted && allRequiredExamsPassed",
        "4 exam slots; final exam slot = 3"
    ], "control")
    cert = card(d, 1525, 145, 380, "Certificate", "Entity", [
        "student, course, finalExamAttempt",
        "status, certificateNo, verificationCode",
        "pdfStoragePath, versionNo",
        "+issue(...), revoke(...), markNeedsReview(...)"
    ], "entity")
    eligibility_model = card(d, 1940, 145, 370, "Eligibility", "Record", [
        "courseCompleted",
        "allRequiredExamsPassed",
        "bestFinalAttempt",
        "+eligible(): boolean"
    ], "entity")
    repos = card(d, 1525, 600, 785, "Certificate and learning repositories", "Repository", [
        "CertificateRepository, EnrollmentRepository",
        "ExamAttemptRepository, CourseProgressItemRepository",
        "CourseRepository, ProfileRepository"
    ], "repo")
    storage = card(d, 1525, 905, 785, "SupabaseStorageClient", "Client", [
        "+upload(bucket, path, contentType, bytes)",
        "+generateSignedUrl(...)",
        "+generateSignedDownloadUrl(...)"
    ], "external")
    arrow(d, point_on(ui,"bottom"), point_on(ctr,"top"), "HTTP request")
    arrow(d, point_on(ctr,"right"), point_on(service,"left"), "request / read / verify")
    arrow(d, point_on(service,"bottom"), point_on(eligibility,"top"), "evaluate enrollment")
    arrow(d, point_on(eligibility,"right"), point_on(eligibility_model,"left"), "build result")
    arrow(d, point_on(service,"right"), point_on(cert,"left"), "issue or reissue")
    arrow(d, point_on(service,"right"), point_on(repos,"left"), "load/save certificate data", label_offset=(0,-42))
    arrow(d, point_on(eligibility,"right"), point_on(repos,"left"), "progress + exam evidence", label_offset=(0,18))
    arrow(d, point_on(service,"right"), point_on(storage,"left"), "upload PDF / signed URLs")
    note(d, (120, 1160, 2280, 1480),
         "Chứng chỉ chỉ được cấp khi học sinh đã ghi danh, hoàn thành 100% nội dung và đạt đủ 4 bài kiểm tra bắt buộc, bao gồm bài cuối kỳ. "
         "Hệ thống sinh PDF + QR, tải lên storage, lưu mã chứng chỉ/mã xác minh. Endpoint xác minh là công khai; chỉ ISSUED hoặc REISSUED được xem là hợp lệ.")
    im.save(OUT / "UC47_Class_Diagram.png", dpi=(300,300))


def sequence_base(title_text: str, participants: list[tuple[str,str]]):
    im = Image.new("RGB", (2400, 1950), COLORS["white"])
    d = ImageDraw.Draw(im)
    title(d, title_text)
    # Keep participant headers fully inside the canvas, even for long names.
    left, right = 155, 2245
    xs = [left + i * (right-left)/(len(participants)-1) for i in range(len(participants))]
    top, bottom = 135, 1895
    for idx, ((name, kind), x) in enumerate(zip(participants, xs)):
        w = min(250, max(155, int(d.textlength(name, font=font(19,bold=True))+32)))
        fill = COLORS[kind]
        rounded_box(d, (x-w/2, top, x+w/2, top+56), fill=fill, outline=COLORS["line"], width=2, radius=8)
        d.text((x, top+28), name, font=font(19,bold=True), fill=COLORS["ink"], anchor="mm")
        y = top+56
        while y < bottom:
            d.line((x, y, x, min(y+14,bottom)), fill=COLORS["grid"], width=2)
            y += 25
    return im, d, xs


def seq_arrow(d, xs, src, dst, y, text, response=False, color=None):
    start = (xs[src], y); end = (xs[dst], y)
    arrow(d, start, end, text, dashed=response, color=color,
          label_offset=(0, -26 if not response else 6))


def fragment(d, y1, y2, label, condition=None, color="#F8FAFD"):
    d.rounded_rectangle((55,y1,2345,y2), radius=10, fill=color, outline="#4F5D73", width=3)
    tag = label if not condition else f"{label}  [{condition}]"
    tw = d.textlength(tag, font=font(19,bold=True))
    d.polygon([(55,y1),(85+tw,y1),(70+tw,y1+32),(55,y1+32)], fill="#E1E7EF", outline="#4F5D73")
    d.text((67,y1+6), tag, font=font(19,bold=True), fill=COLORS["ink"])


def seq_uc45():
    parts=[("Student/Teacher","boundary"),("Quiz/Exam Service","boundary"),("RewardService","control"),
           ("SourceRepository","repo"),("BalanceRepository","repo"),("StudentRewardSource","entity"),("StudentRewardBalance","entity")]
    im,d,xs=sequence_base("UC45 - Tích điểm từ kết quả bài kiểm tra - Runtime Sequence",parts)
    y=245
    seq_arrow(d,xs,0,1,y,"1 submit quiz/exam hoặc chấm bài"); y+=85
    seq_arrow(d,xs,1,2,y,"2 recordAssessmentScore(student, type, assessment, scorePercent)"); y+=90
    d.rounded_rectangle((480,y-20,1920,y+60),radius=10,fill=COLORS["note"],outline=COLORS["note_border"],width=2)
    d.text((1200,y+18),"3 points = clamp(round(scorePercent), 0, 100)",font=font(22,bold=True),fill=COLORS["ink"],anchor="mm"); y+=115
    seq_arrow(d,xs,2,3,y,"4 find source by student + type + assessment"); y+=75
    seq_arrow(d,xs,3,2,y,"5 source hoặc empty",response=True); y+=75
    seq_arrow(d,xs,2,4,y,"6 find balance(studentId)"); y+=75
    seq_arrow(d,xs,4,2,y,"7 balance hoặc create(0,0)",response=True); y+=65
    fragment(d,y,y+535,"alt","so sánh với awardedPoints")
    y+=70
    seq_arrow(d,xs,2,5,y,"8a first result: create source(points)"); y+=75
    seq_arrow(d,xs,5,3,y,"9a save source"); y+=95
    d.line((55,y,2345,y),fill="#718096",width=2); d.text((75,y+8),"else  [điểm mới cao hơn]",font=font(19,bold=True),fill=COLORS["ink"]); y+=60
    seq_arrow(d,xs,2,5,y,"8b delta = points - awardedPoints"); y+=75
    seq_arrow(d,xs,5,3,y,"9b update best score and source"); y+=95
    d.line((55,y,2345,y),fill="#718096",width=2); d.text((75,y+8),"else  [điểm mới thấp hơn hoặc bằng]",font=font(19,bold=True),fill=COLORS["ink"]); y+=70
    seq_arrow(d,xs,2,1,y,"10 delta = 0; không cộng điểm",response=True); y+=95
    d.text((75,y),"end",font=font(19,bold=True),fill=COLORS["muted"]); y+=45
    fragment(d,y,y+245,"opt","delta > 0",color="#F4FBF5")
    y+=65
    seq_arrow(d,xs,2,6,y,"11 balance.addPoints(delta)"); y+=75
    seq_arrow(d,xs,6,4,y,"12 save balance"); y+=75
    seq_arrow(d,xs,2,1,y,"13 return awarded delta",response=True); y+=85
    seq_arrow(d,xs,1,0,y,"14 trả kết quả bài kiểm tra",response=True)
    im.save(OUT/"UC45_Sequence_Diagram.png",dpi=(300,300))


def seq_uc46():
    parts=[("Student","boundary"),("Rewards/Checkout UI","boundary"),("RewardController","boundary"),
           ("OrderController","boundary"),("RewardService","control"),("OrderService","control"),
           ("Reward Repositories","repo"),("OrderRepository","repo"),("PayOS","external")]
    im,d,xs=sequence_base("UC46 - Đổi điểm và dùng voucher giảm giá khóa học - Runtime Sequence",parts)
    y=235
    fragment(d,y,y+430,"group","đổi điểm lấy voucher",color="#F7FBFF"); y+=65
    seq_arrow(d,xs,0,1,y,"1 chọn voucher để đổi"); y+=70
    seq_arrow(d,xs,1,2,y,"2 POST /api/rewards/vouchers/{voucherId}/redeem"); y+=70
    seq_arrow(d,xs,2,4,y,"3 redeemVoucher(studentId, voucherId)"); y+=70
    seq_arrow(d,xs,4,6,y,"4 load voucher + balance"); y+=70
    seq_arrow(d,xs,6,4,y,"5 active voucher, requiredPoints, availablePoints",response=True); y+=65
    fragment(d,y,y+165,"alt","đủ điểm",color="#F4FBF5"); y+=55
    seq_arrow(d,xs,4,6,y,"6 spend points; create StudentRewardVoucher(AVAILABLE)"); y+=65
    seq_arrow(d,xs,4,1,y,"7 updated wallet",response=True); y+=85
    d.text((75,y),"else: VOUCHER_INACTIVE / NOT_ENOUGH_POINTS",font=font(19,bold=True),fill="#9B2C2C"); y+=75
    fragment(d,y,y+620,"group","áp dụng voucher khi mua khóa học",color="#FFFCF3"); y+=65
    seq_arrow(d,xs,0,1,y,"8 chọn khóa học và voucher AVAILABLE"); y+=65
    seq_arrow(d,xs,1,3,y,"9 POST /api/orders(courseIds, rewardVoucherId)"); y+=65
    seq_arrow(d,xs,3,5,y,"10 createOrder(user, request)"); y+=65
    seq_arrow(d,xs,5,7,y,"11 save Order(subtotal)"); y+=65
    seq_arrow(d,xs,5,4,y,"12 reserveVoucherForOrder(..., subtotal)"); y+=65
    seq_arrow(d,xs,4,6,y,"13 lock AVAILABLE voucher → RESERVED"); y+=65
    seq_arrow(d,xs,4,5,y,"14 discount = min(subtotal, voucher.discountAmount)",response=True); y+=65
    seq_arrow(d,xs,5,7,y,"15 applyRewardVoucher; total = subtotal - discount"); y+=65
    seq_arrow(d,xs,5,8,y,"16 create payment request(total)"); y+=75
    fragment(d,y,y+215,"alt","payment result",color="#F8FAFD"); y+=55
    seq_arrow(d,xs,8,5,y,"17a PAID webhook"); y+=55
    seq_arrow(d,xs,5,4,y,"18a markVoucherUsed → USED"); y+=60
    d.line((55,y,2345,y),fill="#718096",width=2); d.text((75,y+6),"else  [cancel / release]",font=font(19,bold=True),fill=COLORS["ink"]); y+=55
    seq_arrow(d,xs,5,4,y,"17b releaseVoucherReservation → AVAILABLE")
    im.save(OUT/"UC46_Sequence_Diagram.png",dpi=(300,300))


def seq_uc47():
    parts=[("Student/Public","boundary"),("Certificate UI","boundary"),("CertificateController","boundary"),
           ("CertificateService","control"),("EligibilityService","control"),("Learning Repositories","repo"),
           ("CertificateRepository","repo"),("StorageClient","external")]
    im,d,xs=sequence_base("UC47 - Cấp và xác minh chứng chỉ - Runtime Sequence",parts)
    y=235
    fragment(d,y,y+810,"group","cấp chứng chỉ",color="#F7FBFF"); y+=65
    seq_arrow(d,xs,0,1,y,"1 yêu cầu cấp chứng chỉ cho khóa học"); y+=70
    seq_arrow(d,xs,1,2,y,"2 POST /api/student/courses/{courseId}/certificate"); y+=70
    seq_arrow(d,xs,2,3,y,"3 requestIssue(courseId, student)"); y+=70
    seq_arrow(d,xs,3,5,y,"4 require enrollment"); y+=70
    seq_arrow(d,xs,3,4,y,"5 evaluate(enrollment)"); y+=70
    seq_arrow(d,xs,4,5,y,"6 load progress + 4 required exams + best final attempt"); y+=70
    seq_arrow(d,xs,5,4,y,"7 Eligibility",response=True); y+=65
    fragment(d,y,y+330,"alt","eligible = course 100% và đạt đủ 4 bài kiểm tra",color="#F4FBF5"); y+=60
    seq_arrow(d,xs,3,6,y,"8 find/create Certificate"); y+=60
    seq_arrow(d,xs,3,3,y,"9 build PDF + QR verification code"); y+=60
    seq_arrow(d,xs,3,7,y,"10 upload certificates/{path}.pdf"); y+=60
    seq_arrow(d,xs,3,6,y,"11 issue/reissue; save certificate"); y+=60
    seq_arrow(d,xs,3,1,y,"12 CertificateResponse + signed URLs",response=True); y+=75
    d.line((55,y,2345,y),fill="#718096",width=2); d.text((75,y+7),"else  [not eligible] → CERTIFICATE_NOT_ELIGIBLE",font=font(19,bold=True),fill="#9B2C2C"); y+=95
    fragment(d,y,y+355,"group","xác minh công khai",color="#FFFCF3"); y+=65
    seq_arrow(d,xs,0,1,y,"13 mở /certificates/verify/{verificationCode}"); y+=70
    seq_arrow(d,xs,1,2,y,"14 GET /api/certificates/verify/{code}"); y+=70
    seq_arrow(d,xs,2,3,y,"15 verify(code)"); y+=70
    seq_arrow(d,xs,3,6,y,"16 findByVerificationCode(code)"); y+=70
    seq_arrow(d,xs,6,3,y,"17 Certificate",response=True); y+=65
    seq_arrow(d,xs,3,1,y,"18 valid iff status ISSUED or REISSUED",response=True)
    im.save(OUT/"UC47_Sequence_Diagram.png",dpi=(300,300))


def main():
    class_uc45(); class_uc46(); class_uc47()
    seq_uc45(); seq_uc46(); seq_uc47()
    for path in sorted(OUT.glob("*.png")):
        print(path.name, path.stat().st_size)


if __name__ == "__main__":
    main()
