from __future__ import annotations

import copy
import hashlib
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from lxml import etree


W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W14 = "http://schemas.microsoft.com/office/word/2010/wordml"
XML = "http://www.w3.org/XML/1998/namespace"
NS = {"w": W, "w14": W14}
qn = lambda local: f"{{{W}}}{local}"


def text_of(element: etree._Element) -> str:
    return "".join(element.xpath(".//w:t/text()", namespaces=NS)).strip()


def body_children(root: etree._Element) -> list[etree._Element]:
    body = root.find("w:body", NS)
    assert body is not None
    return list(body)


def find_paragraph(root: etree._Element, exact: str, occurrence: int = 1) -> etree._Element:
    matches = [
        p for p in root.xpath("//w:body/w:p", namespaces=NS)
        if text_of(p) == exact
    ]
    if len(matches) < occurrence:
        raise RuntimeError(f"Paragraph not found: {exact!r}, occurrence {occurrence}")
    return matches[occurrence - 1]


def remove_unique_markup(element: etree._Element) -> None:
    for node in element.iter():
        for attr in list(node.attrib):
            if attr.startswith(f"{{{W14}}}") or attr.startswith(f"{{{W}}}rsid"):
                del node.attrib[attr]
    for node in element.xpath(
        ".//w:bookmarkStart | .//w:bookmarkEnd | .//w:commentRangeStart | "
        ".//w:commentRangeEnd | .//w:commentReference | .//w:proofErr | "
        ".//w:permStart | .//w:permEnd",
        namespaces=NS,
    ):
        parent = node.getparent()
        if parent is not None:
            parent.remove(node)


def set_paragraph_text(paragraph: etree._Element, text: str) -> None:
    ppr = paragraph.find("w:pPr", NS)
    run_template = paragraph.find("w:r", NS)
    rpr = copy.deepcopy(run_template.find("w:rPr", NS)) if run_template is not None and run_template.find("w:rPr", NS) is not None else None
    for child in list(paragraph):
        if child is not ppr:
            paragraph.remove(child)
    if text:
        run = etree.Element(qn("r"))
        if rpr is not None:
            run.append(rpr)
        t = etree.SubElement(run, qn("t"))
        if text[:1].isspace() or text[-1:].isspace():
            t.set(f"{{{XML}}}space", "preserve")
        t.text = text
        paragraph.append(run)


def clone_paragraph(template: etree._Element, text: str) -> etree._Element:
    paragraph = copy.deepcopy(template)
    remove_unique_markup(paragraph)
    set_paragraph_text(paragraph, text)
    return paragraph


def apply_paragraph_style(target: etree._Element, style_source: etree._Element) -> None:
    source_ppr = style_source.find("w:pPr", NS)
    old_ppr = target.find("w:pPr", NS)
    if old_ppr is not None:
        target.remove(old_ppr)
    if source_ppr is not None:
        target.insert(0, copy.deepcopy(source_ppr))


def set_cell_text(cell: etree._Element, text: str) -> None:
    tcpr = cell.find("w:tcPr", NS)
    paragraph_template = cell.find("w:p", NS)
    if paragraph_template is None:
        paragraph_template = etree.Element(qn("p"))
    paragraph = clone_paragraph(paragraph_template, text)
    for child in list(cell):
        if child is not tcpr:
            cell.remove(child)
    cell.append(paragraph)


def clone_table(template: etree._Element, rows: list[list[str]]) -> etree._Element:
    table = copy.deepcopy(template)
    remove_unique_markup(table)
    trs = table.findall("w:tr", NS)
    if not trs:
        raise RuntimeError("Template table has no rows")
    header_template = trs[0]
    body_template = trs[1] if len(trs) > 1 else trs[0]
    for tr in trs:
        table.remove(tr)
    for index, data in enumerate(rows):
        tr = copy.deepcopy(header_template if index == 0 else body_template)
        remove_unique_markup(tr)
        cells = tr.findall("w:tc", NS)
        if len(cells) != len(data):
            raise RuntimeError(f"Table template has {len(cells)} cells, row has {len(data)} values")
        for cell, value in zip(cells, data):
            set_cell_text(cell, value)
        table.append(tr)
    return table


def replace_table_rows(table: etree._Element, rows: list[list[str]]) -> None:
    replacement = clone_table(table, rows)
    parent = table.getparent()
    assert parent is not None
    parent.replace(table, replacement)


def find_next_table(paragraph: etree._Element) -> etree._Element:
    node = paragraph.getnext()
    while node is not None:
        if node.tag == qn("tbl"):
            return node
        node = node.getnext()
    raise RuntimeError(f"No table after paragraph {text_of(paragraph)!r}")


def insert_before(anchor: etree._Element, elements: list[etree._Element]) -> None:
    parent = anchor.getparent()
    assert parent is not None
    index = parent.index(anchor)
    for element in elements:
        parent.insert(index, element)
        index += 1


def replace_text_fragment(element: etree._Element, old: str, new: str) -> int:
    count = 0
    for node in element.xpath(".//w:t", namespaces=NS):
        if node.text and old in node.text:
            node.text = node.text.replace(old, new)
            count += 1
    return count


def build_design_section(
    templates: dict[str, etree._Element],
    heading: str,
    description: str,
    related: str,
    implementation_screen: str,
    ui_rows: list[list[str]],
    db_rows: list[list[str]],
    sql_lines: list[str],
) -> list[etree._Element]:
    elements = [
        clone_paragraph(templates["h3"], heading),
        clone_paragraph(templates["body"], description),
        clone_paragraph(templates["body"], f"Related use cases: {related}"),
        clone_paragraph(templates["h4"], "UI Design"),
        clone_paragraph(templates["body"], f"Implementation screen: {implementation_screen}"),
        clone_table(templates["ui_table"], [["Field Name", "Field Type", "Description"], *ui_rows]),
        clone_paragraph(templates["h4"], "Database Access"),
    ]
    if db_rows:
        elements.append(clone_table(templates["db_table"], [["Table", "CRUD", "Description"], *db_rows]))
    else:
        elements.append(clone_paragraph(templates["body"], "None. The current implementation does not persist this interaction."))
    elements.append(clone_paragraph(templates["body"], "SQL Commands"))
    for line in sql_lines or ["None"]:
        elements.append(clone_paragraph(templates["sql"], line))
    return elements


NON_UI_ROWS = [
    ["#", "Feature", "System Function", "Description"],
    ["1", "NF-01", "JWT Verification and Role-Based Access", "JwtAuthenticationFilter validates Supabase-issued JWTs, creates the authenticated principal, and SecurityConfig restricts student, parent, teacher, and admin routes."],
    ["2", "NF-02", "Authentication, OTP, and Email Delivery", "Supabase Auth handles account credentials; the backend sends registration/password-reset OTP and parent-link or notification emails through SMTP."],
    ["3", "NF-03", "Private Storage and Secure Download", "Supabase Storage is used for course files. The backend generates temporary signed URLs, one-time document tokens, PDF watermarks, download audit records, and rate limits."],
    ["4", "NF-04", "PayOS Payment and Idempotent Webhook", "OrderService creates PayOS payment links. The webhook verifies payment data, prevents duplicate processing, marks the order paid, creates enrollment, and records revenue splits."],
    ["5", "NF-05", "Revenue Split and Payout Reconciliation", "Paid order items are split into platform and teacher amounts, grouped by payout period, exported, and marked paid only after an admin records transfer information."],
    ["6", "NF-06", "Gemini AI Integration", "AiChatService calls Gemini 2.5 Flash for student tutoring and a four-week roadmap. The API key stays on the backend; roadmap prompts include aggregated learning progress."],
    ["7", "NF-07", "Learning Progress Aggregation", "CourseProgressService combines enrollment progress, unique video watch segments, completion rules, quizzes, required exams, and assignment results; reports are available as JSON and PDF."],
    ["8", "NF-08", "Certificate Generation and Verification", "The backend checks 100% content progress and four required passed exams, generates a PDF and QR code, issues signed links, exposes public verification, and manages review/reissue/revocation."],
    ["9", "NF-09", "Notifications and Cross-Role Messaging", "UserNotificationService stores in-app notifications. Email is used for selected parent, teacher, grading, payout, and approval events."],
    ["10", "NF-10", "Retention and Expiration Jobs", "Scheduled services delete expired temporary watermarked files and apply Q&A retention; parent-link invitations and download tokens are expired by service rules."],
]


DB_TABLES = [
    ("admin_notifications", "Admin-created broadcast definitions and target groups."),
    ("course_approval_history", "Admin decisions and notes for submitted course reviews."),
    ("assignments", "Teacher assignments attached to lessons or chapters, including due date and submission policy."),
    ("assignment_submissions", "Student assignment attempts, files, status, score, feedback, lateness, and grading timestamps."),
    ("categories", "Course subject/category reference data."),
    ("certificates", "Issued course certificates, lifecycle status, verification code, PDF path, and version."),
    ("chapters", "Ordered chapters belonging to a course."),
    ("complaints", "User complaints, category, status, owner, and resolution metadata."),
    ("complaint_attachments", "Files attached to complaint messages."),
    ("complaint_messages", "Conversation entries between users and admins for a complaint."),
    ("courses", "Course catalog data, teacher/category ownership, price, publication, and review status."),
    ("course_discussion_replies", "Replies posted inside course discussion threads."),
    ("course_discussion_threads", "Discussion topics associated with a course and author."),
    ("course_documents", "Learning documents attached to lessons, including private storage metadata."),
    ("course_progress_items", "Completed lesson, quiz, assignment, or other progress items per student and course."),
    ("course_reviews", "Student rating, comment, and moderation state for a course."),
    ("course_versions", "Immutable course snapshots used to preserve enrollment-specific content and exam rules."),
    ("course_version_migration_logs", "Audited enrollment migrations between course versions."),
    ("enrollments", "Student-course ownership, pinned course version, enrollment time, and progress percentage."),
    ("exam_ai_audit_logs", "Audit records for AI-assisted exam/question generation."),
    ("exam_attempts", "Student required-exam attempts, answers, scoring, grading, and retake state."),
    ("exam_configs", "Four-slot required exam configuration, chapter scope, duration, and question settings."),
    ("exam_integrity_events", "Server-recorded fullscreen, copy/paste, focus, and other exam-integrity events."),
    ("exam_retake_requests", "Student requests and teacher decisions for exam retakes."),
    ("grade_audit_logs", "Old/new grades, grader, reason, and timestamps for grade changes."),
    ("lessons", "Ordered learning units, video/storage metadata, free-trial flag, and completion rules."),
    ("orders", "Checkout transaction, payer, amounts, voucher discount, PayOS reference, status, and expiry."),
    ("order_items", "Courses and price snapshots contained in an order."),
    ("parent_link_audit_log", "Audit trail for parent-student invitation, consent, status, and unlink actions."),
    ("parent_progress_access_audit", "Records parent access to a linked student's progress data."),
    ("parent_student_links", "Parent-student relationship, invitation state, consent, expiry, and revocation."),
    ("payout_periods", "Monthly teacher payout totals, status, transfer reference/content, and confirmation metadata."),
    ("profiles", "Application role and profile data mapped to the Supabase Auth user ID."),
    ("qa_messages", "Messages and attachments within student/parent-teacher Q&A threads."),
    ("qa_threads", "Course Q&A threads, participants, visibility, status, and duplicate linkage."),
    ("questions", "Teacher-authored question bank items and active/archive state."),
    ("question_audit_logs", "Audit history for question creation, edits, deletion, import, and archive actions."),
    ("question_banks", "Teacher-owned banks organized by title, category, grade, and state."),
    ("question_choices", "Answer choices and correctness flags for objective questions."),
    ("question_versions", "Immutable snapshots of questions already used by an assessment."),
    ("quiz_attempts", "Student chapter-quiz attempts and question snapshots."),
    ("quiz_configs", "Chapter quiz configuration and random question selection settings."),
    ("revenue_splits", "Immutable order-item revenue allocation for teacher and platform, linked to a payout period."),
    ("reward_vouchers", "Voucher definitions available through the student reward program."),
    ("student_document_downloads", "One-time secure document token, expiry, file hash, and download audit data."),
    ("student_lesson_notes", "Private notes created by a student for a lesson."),
    ("student_reward_balances", "Current reward-point balance per student."),
    ("student_reward_sources", "Auditable events that credit or debit student reward points."),
    ("student_reward_vouchers", "Voucher ownership and redemption state per student."),
    ("student_video_progress", "Unique watched video segments and completion state per student and lesson."),
    ("system_settings", "Singleton administrative settings, including maintenance mode."),
    ("teacher_bank_accounts", "Teacher bank information and verification status used for payouts."),
    ("teacher_bank_audit_log", "Audited changes and review decisions for teacher bank information."),
    ("user_notifications", "Per-user in-app notification records and read state."),
]


PACKAGE_ROWS = [
    ["No", "Package", "Description"],
    ["01", "frontend_app", "React application entry points, route configuration, and global shell (main.tsx, App.tsx)."],
    ["02", "frontend_pages_common", "Shared public screens: landing, login, registration, password recovery, OAuth callback, maintenance, and certificate verification."],
    ["03", "frontend_pages_student", "Student portal: discovery, checkout, learning, assignments, exams, progress, certificates, rewards, complaints, notifications, and AI tutor."],
    ["04", "frontend_pages_teacher", "Teacher portal: course/content authoring, question banks, exams, grading, Q&A, bank account, reviews, and revenue."],
    ["05", "frontend_pages_parents", "Parent portal: child links, overview, progress reports, payments, and teacher messaging."],
    ["06", "frontend_pages_admin", "Admin portal: dashboard, user management, course approval, complaints, payouts, reviews, Q&A, notifications, and settings."],
    ["07", "frontend_components", "Reusable navigation, layout, authorization, media, Q&A, complaint, teacher, and admin UI components."],
    ["08", "frontend_api", "Typed Axios service modules that map frontend operations to REST endpoints."],
    ["09", "frontend_store", "Zustand stores for authentication, cart, course, and system state."],
    ["10", "frontend_lib", "Shared utilities for toasts, offline progress synchronization, formatting, and parent reports."],
    ["11", "frontend_types", "Shared TypeScript API and course domain contracts."],
    ["12", "frontend_e2e", "Playwright end-to-end specifications for parent links, parent progress, and other browser flows."],
    ["13", "backend_controller", "Spring REST controllers for public, student, parent, teacher, and admin APIs."],
    ["14", "backend_service", "Transactional business rules for authentication, learning, assessment, payment, AI, messaging, reporting, and administration."],
    ["15", "backend_model", "JPA entities and enums mapped to the implemented PostgreSQL schema."],
    ["16", "backend_repository", "Spring Data JPA repositories and domain-specific queries."],
    ["17", "backend_dto_request", "Validated inbound REST request contracts."],
    ["18", "backend_dto_response", "Typed outbound API response contracts and pagination wrappers."],
    ["19", "backend_config", "Security, CORS, PayOS, Supabase, REST client, maintenance, and startup schema-safety configuration."],
    ["20", "backend_security", "Authenticated-user principal and current-user access helpers."],
    ["21", "backend_client", "Supabase Auth and Storage clients plus provider DTOs."],
    ["22", "backend_exception", "Centralized API error types and exception handling."],
    ["23", "backend_resources", "Environment-driven Spring configuration for PostgreSQL, Supabase, SMTP, PayOS, Gemini, uploads, and logging."],
    ["24", "backend_db_migrations", "Versioned SQL migrations and seed/maintenance scripts for implemented features."],
    ["25", "backend_tests_postman", "JUnit/Spring tests and Postman collection/guide for service, controller, validation, and API verification."],
]


APPENDIX_ASSUMPTIONS = [
    "AS-01: The frontend runs in a modern browser with JavaScript, cookies/local storage, and network access enabled.",
    "AS-02: Supabase Auth, PostgreSQL, and Storage are available and configured through environment variables; application profile IDs match Auth user UUIDs.",
    "AS-03: The backend runs on Java 21 with Spring Boot 3.2.5; the frontend uses React 19, TypeScript 5.8, and Vite 6.",
    "AS-04: Gmail-compatible SMTP credentials are available for OTP and selected cross-role notifications.",
    "AS-05: PayOS merchant credentials and a reachable webhook URL are available for production payment confirmation.",
    "AS-06: A Gemini API key is optional; AI tutoring and roadmap features require it, while the rest of the platform remains usable without it.",
    "AS-07: Teacher payouts are transferred outside the system and then confirmed by an admin using the recorded bank account and transfer reference.",
    "DE-01: PostgreSQL schema changes are applied through repository migrations; Hibernate ddl-auto is disabled.",
    "DE-02: Private course media and generated certificate files depend on Supabase Storage signed-URL behavior.",
    "DE-03: PDF/QR generation depends on OpenPDF and ZXing; Excel exports depend on Apache POI.",
]


LIMITATION_ROWS = [
    ["ID", "Limitation / Exclusion", "Current Handling"],
    ["LE-01", "The implemented payment gateway is PayOS, not the VNPay/MoMo wording found in older requirement drafts.", "RDS design and non-UI descriptions use PayOS as the code-aligned implementation."],
    ["LE-02", "Refund, chargeback, full payment reconciliation, and legally compliant e-invoice workflows are not complete.", "Orders, payment results, history, complaints, and payout records are implemented."],
    ["LE-03", "Video upload exists, but a production HLS transcoding/CDN pipeline and original-media retention policy are not implemented in this repository.", "Private storage, signed access, progress tracking, and player fallback are implemented."],
    ["LE-04", "AI chat history, consent/opt-out, deletion, rate-limit policy, and AI governance audit are not persisted end to end.", "Chat remains client-side; roadmap uses aggregated progress and Gemini through the backend."],
    ["LE-05", "Admin password reset and a complete security audit trail for all account changes are not implemented as one closed workflow.", "Admin can search users, block/unblock, change role, and approve/reject teachers."],
    ["LE-06", "Push notifications, scheduled broadcasts, reusable templates, and full multi-channel delivery are outside the current implementation.", "In-app notifications and selected SMTP email events are available."],
    ["LE-07", "Repository code does not provision database backups, centralized ELK/Loki monitoring, infrastructure scaling, or disaster recovery.", "Operational deployment must supply those platform capabilities."],
    ["LE-08", "External service availability and quota for Supabase, PayOS, SMTP, and Gemini are not controlled by Bee Academy.", "Services expose validation/errors and the main platform degrades without optional AI."],
]


BUSINESS_RULE_ROWS = [
    ["ID", "Category", "Rule Definition"],
    ["BR-01", "Access", "Every protected API requires a valid Supabase JWT and an allowed application role."],
    ["BR-02", "Account", "An admin account cannot be blocked through the user-management block endpoint."],
    ["BR-03", "Teacher", "Course, assessment, question-bank, grading, and payout operations require an approved teacher profile where enforced by TeacherAccessService."],
    ["BR-04", "Course", "A course remains draft until submitted and approved; publication validation checks required structure and assessment coverage."],
    ["BR-05", "Payment", "A successful PayOS payment is processed idempotently; it creates access once and records an immutable revenue split."],
    ["BR-06", "Enrollment", "Learning content, assignments, downloads, progress, reviews, and certificates require ownership/enrollment unless explicitly public or free-trial."],
    ["BR-07", "Video", "A video lesson is completed only after the unique watched duration reaches the configured completion threshold (90% in the implemented rule)."],
    ["BR-08", "Documents", "Private learning documents use one-time download tokens with a five-minute expiry; downloads are audited and rate-limited."],
    ["BR-09", "Assignment", "A submission must contain text or an allowed file, respect size/attempt/deadline policy, and records lateness and expected grading date."],
    ["BR-10", "Exam", "Required exams use four configured slots and unlock based on completion of the defined chapter scope."],
    ["BR-11", "Integrity", "Exam integrity events are recorded server-side and repeated violations can trigger warnings or automatic submission."],
    ["BR-12", "Grading", "Scores must be within the assessment maximum; grade changes are audited and may require a reason."],
    ["BR-13", "Review", "A course review requires enrollment, sufficient learning progress, a 1-5 rating, and a comment within configured length rules."],
    ["BR-14", "Certificate", "A certificate is issued only when course progress is 100% and all four required exams are passed."],
    ["BR-15", "Certificate", "A later required-exam grade change re-evaluates the certificate and may move it to review, reissued, or revoked."],
    ["BR-16", "Parent", "Parent access to child progress, payments, and teacher messaging requires an ACTIVE parent-student link and applicable privacy consent."],
    ["BR-17", "Parent", "A parent link invitation expires after seven days; revocation immediately removes protected parent access."],
    ["BR-18", "Payout", "Admin can confirm a payout only for an eligible period with verified teacher bank information and a transfer reference."],
    ["BR-19", "Notification", "Cross-role events create per-user notifications; read state is stored independently for each recipient."],
    ["BR-20", "Maintenance", "When maintenance mode is enabled, the maintenance filter restricts normal application access according to configured exceptions."],
]


TRACEABILITY_ROWS = [
    ["Module / UC Range", "Primary Frontend", "Primary Backend / Data"],
    ["Authentication (UC01-UC05)", "common Login/Register/ForgotPassword; role account pages", "AuthController, ProfileController, AuthService; profiles + Supabase Auth"],
    ["Discovery (UC06-UC08)", "student CoursesPage and CourseDetailPage", "CourseController/CourseService; courses, categories, chapters, lessons, reviews"],
    ["Purchase (UC09-UC12)", "Checkout, Orders, PaymentResult, Complaints", "OrderController, PayOSWebhookController, ComplaintController; orders, order_items, enrollments, complaints"],
    ["Learning (UC13-UC20)", "course LearningView, AssignmentsPanel, Exam, Progress, Certificates", "CourseProgress, Assignment, Exam, Document, Certificate controllers/services and related learning tables"],
    ["Interaction (UC21-UC23)", "Q&A pages and AiTutorPage", "QaController/QaService; AiStudentController/AiChatService; qa_threads/messages and progress reads"],
    ["Parent (UC24-UC29)", "ParentDashboard, ParentProgress, ParentPayments, ParentMessages, ParentStudentLink", "ParentController and link/progress/payment/messaging services; parent links, audits, orders, progress"],
    ["Teacher (UC30-UC37)", "Teacher Courses/Content/QuestionBank/Exam/Grades/Q&A/Revenue", "Teacher course, assignment, grading, Q&A, bank, and revenue controllers/services"],
    ["Admin (UC38-UC44)", "DashboardAdmin, Approvals, moderation, complaints, payouts, notifications", "Admin dashboard/user/course/complaint/bank/payout/notification controllers and audit/status tables"],
]


def main() -> None:
    source = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    expected_hash = "FAFB7B6DD54A1D877D19DB285D9DAF59D4D37A1906BB52749BCD47BBB9D5E468"
    actual_hash = hashlib.sha256(source.read_bytes()).hexdigest().upper()
    if actual_hash != expected_hash:
        raise RuntimeError(f"Source hash mismatch: {actual_hash}")

    with zipfile.ZipFile(source, "r") as zin:
        package = {info.filename: zin.read(info.filename) for info in zin.infolist()}
        infos = {info.filename: info for info in zin.infolist()}

    parser = etree.XMLParser(remove_blank_text=False)
    root = etree.fromstring(package["word/document.xml"], parser)

    # Remove the stale Appendix placeholder from the cached TOC while retaining
    # its PAGEREF field. Word will rebuild all new entries on open.
    replace_text_fragment(root, "4. ..", "4. Implementation Traceability")
    replace_text_fragment(root, "approval_history", "course_approval_history")
    replace_text_fragment(root, "SUM(amount)", "SUM(total_amount)")

    # Cover and change record.
    set_paragraph_text(find_paragraph(root, "Version: 1.0"), "Version: 1.1")
    date_paragraphs = [p for p in root.xpath("//w:body/w:p", namespaces=NS) if "Da Nang" in text_of(p)]
    if date_paragraphs:
        set_paragraph_text(date_paragraphs[0], "– Da Nang, July 2026 –")
    changes_heading = find_paragraph(root, "Record of Changes")
    changes_table = find_next_table(changes_heading)
    replace_table_rows(changes_table, [
        ["Version", "Date", "A* M, D", "In charge", "Change Description"],
        ["V1.0", "18/06/2026", "A", "Group 3", "Initial Requirement & Design Specification baseline."],
        ["V1.1", "21/07/2026", "A/M", "Group 3", "Completed code-aligned design sections, non-UI functions, database/package inventory, and project appendix."],
    ])

    # Replace code-aligned architecture inventories.
    non_ui_heading = find_paragraph(root, "2.4 Non-UI Functions")
    replace_table_rows(find_next_table(non_ui_heading), NON_UI_ROWS)

    table_desc_heading = find_paragraph(root, "b. Table Descriptions", occurrence=1)
    table_desc_table = find_next_table(table_desc_heading)
    replace_table_rows(
        table_desc_table,
        [["No", "Table", "Description"], *[[f"{i:02d}", name, desc] for i, (name, desc) in enumerate(DB_TABLES, 1)]],
    )
    table_desc_table = find_next_table(table_desc_heading)
    note_template = find_paragraph(root, "Package descriptions")
    insert_before(table_desc_table, [clone_paragraph(
        note_template,
        "Implemented JPA entity inventory (authoritative for Version 1.1). The preceding schema figures are conceptual views of the same functional areas.",
    )])

    code_packages = find_paragraph(root, "3.2 Code Packages")
    heading3_source = find_paragraph(root, "3.1 Database Design")
    apply_paragraph_style(code_packages, heading3_source)
    package_label = find_paragraph(root, "Package descriptions")
    replace_table_rows(find_next_table(package_label), PACKAGE_ROWS)

    # Templates for inserted design subsections.
    ui_heading = find_paragraph(root, "UI Design", occurrence=1)
    db_heading = find_paragraph(root, "Database Access", occurrence=1)
    templates = {
        "h3": find_paragraph(root, "4.5 Take Exam"),
        "h4": ui_heading,
        "body": find_paragraph(root, "Students take end-of-chapter quizzes or exams; the system grades them based on a snapshot."),
        "sql": find_paragraph(root, "SELECT * FROM quiz_configs WHERE chapter_id = 'chapter-uuid';"),
        "ui_table": find_next_table(ui_heading),
        "db_table": find_next_table(db_heading),
    }

    sections = []
    sections.append((
        "4.5 Take Exam",
        build_design_section(
            templates,
            "4.4 Submit Assignment",
            "Students submit a text answer and/or supported files, view submission policy and status, and resubmit within the configured attempt limit.",
            "UC16_SubmitAssignment",
            "Student course detail > Assignments panel (CourseAssignmentsPanel.tsx).",
            [
                ["Assignment Card", "Card", "Shows title, chapter/lesson, maximum score, due date, attempts, late policy, and current status."],
                ["Answer", "Textarea", "Enter a text response; either text or at least one file is required."],
                ["Attachments", "File Upload", "Upload allowed assignment files up to 25 MB each through the protected student endpoint."],
                ["Submit / Resubmit", "Button", "Create or update the student's submission when the policy accepts another attempt."],
                ["Submission Result", "Status Panel", "Shows submitted time, late flag, attempt number, expected grading date, score, and teacher feedback."],
            ],
            [
                ["assignments", "R", "Loads the assignment, deadline, maximum attempts, and late-submission policy."],
                ["enrollments", "R", "Verifies that the student owns the course."],
                ["assignment_submissions", "C/U/R", "Creates or updates the student's attempt and later exposes score/feedback."],
                ["course_progress_items", "C", "Marks assignment-based completion rules when submission or passing conditions are met."],
            ],
            [
                "SELECT * FROM assignments WHERE chapter_id IN (SELECT id FROM chapters WHERE course_id = 'course-uuid');",
                "INSERT INTO assignment_submissions(id, assignment_id, student_id, content, file_urls, status, submitted_at, attempt_number) VALUES ('sub-uuid', 'assignment-uuid', 'student-uuid', 'Answer text', '[]'::jsonb, 'SUBMITTED', NOW(), 1);",
            ],
        ),
    ))
    sections.append((
        "4.7 Review Course",
        build_design_section(
            templates,
            "4.6 View Grades and Learning Progress",
            "Students review course and chapter completion, unique video watch progress, quiz/assignment results, and all four required exam states, with PDF export.",
            "UC18_ViewGradesProgress",
            "Student dashboard > Progress (ProgressPage.tsx).",
            [
                ["Progress Summary", "Cards/Progress Bar", "Shows enrolled courses, overall percentage, completed items, and learning status."],
                ["Required Exams", "Status Grid", "Shows the four required exams, chapter scope, score, pass/fail/pending state, and retake information."],
                ["Chapter Progress", "List", "Shows chapter completion, lesson/quiz state, and latest quiz score."],
                ["Assignment Results", "List", "Shows submitted time, lateness, score, maximum score, and grading state."],
                ["Export PDF", "Button", "Downloads the consolidated learning-progress report."],
                ["Learning Roadmap", "Link/Button", "Opens the AI roadmap tab using the same aggregated progress context."],
            ],
            [
                ["enrollments", "R", "Loads owned courses, pinned version, enrollment date, and progress percentage."],
                ["course_progress_items", "R", "Counts completed content and assessment items."],
                ["student_video_progress", "R", "Provides unique watched segments and video completion."],
                ["quiz_attempts", "R", "Loads chapter quiz scores and completion."],
                ["exam_attempts", "R", "Loads required exam score/status and retake state."],
                ["assignment_submissions", "R", "Loads assignment score, feedback, lateness, and grading status."],
            ],
            [
                "SELECT course_id, progress_pct, progress_updated_at FROM enrollments WHERE student_id = 'student-uuid';",
                "SELECT item_type, COUNT(*) FROM course_progress_items WHERE student_id = 'student-uuid' AND course_id = 'course-uuid' GROUP BY item_type;",
                "SELECT * FROM exam_attempts WHERE student_id = 'student-uuid' ORDER BY submitted_at DESC;",
            ],
        ),
    ))
    sections.append((
        "5. Interaction and Support",
        build_design_section(
            templates,
            "4.8 View and Download Certificate",
            "Students view certificate eligibility and lifecycle status, request issue after satisfying all conditions, and open or download a time-limited PDF with public QR verification.",
            "UC20_ViewDownloadCertificate",
            "Student dashboard > Certificates (CertificatesPage.tsx) and public CertificateVerifyPage.tsx.",
            [
                ["Eligibility Card", "Card", "Shows course progress and how many of the four required exams are passed."],
                ["Issue Certificate", "Button", "Requests issuance when progress is 100% and all required exams are passed; repeated requests are rate-limited."],
                ["View / Download", "Button", "Opens a signed PDF URL or downloads the certificate file."],
                ["Status Badge", "Badge", "Shows ISSUED, REISSUED, NEEDS_REVIEW, or REVOKED."],
                ["Verification Link / QR", "Link", "Copies or opens the public verification page using the verification code."],
                ["Certificate History", "List", "Shows certificate number, course, issue date, and latest lifecycle state."],
            ],
            [
                ["enrollments", "R", "Verifies ownership, progress, and pinned course version."],
                ["course_progress_items", "R", "Checks content completion against the course/version item count."],
                ["exam_attempts", "R", "Confirms passed attempts for all required exam configurations."],
                ["certificates", "C/U/R", "Issues, retrieves, reissues, reviews, revokes, and verifies certificate records."],
                ["courses / profiles", "R", "Loads course, teacher, and student names for the PDF."],
            ],
            [
                "SELECT * FROM certificates WHERE student_id = 'student-uuid' ORDER BY issued_at DESC;",
                "SELECT COUNT(DISTINCT exam_config_id) FROM exam_attempts WHERE student_id = 'student-uuid' AND course_id = 'course-uuid' AND passed = TRUE;",
            ],
        ),
    ))
    sections.append((
        "6. Parent",
        build_design_section(
            templates,
            "5.2 AI Support Chat",
            "Students ask multi-turn study questions and receive Markdown/LaTeX-capable answers from the backend Gemini integration; the current session history is kept in the browser.",
            "UC22_AISupportChat",
            "Student dashboard > AI Tutor > Chat tab (AiTutorPage.tsx).",
            [
                ["Chat / Roadmap Tabs", "Tabs", "Switches between tutoring conversation and personalized roadmap."],
                ["Suggested Questions", "Quick Actions", "Provides sample prompts when the conversation is empty."],
                ["Conversation", "Message List", "Shows student and Bee AI messages, including formatted mathematics and Markdown."],
                ["Question", "Textarea", "Accepts a study question; Enter sends and Shift+Enter adds a line."],
                ["Send", "Button", "Calls POST /api/student/ai/chat and displays loading/error state."],
            ],
            [],
            ["None. AiChatService sends the request and client-side message history to Gemini; the current implementation does not store chat sessions in PostgreSQL."],
        ) + build_design_section(
            templates,
            "5.3 Receive AI Learning Roadmap Recommendation",
            "The system aggregates the student's real learning progress and asks Gemini to generate a structured four-week roadmap with summary, weekly focus, goals, and actionable tasks.",
            "UC23_AIStudyRoadmap",
            "Student dashboard > AI Tutor > Learning Roadmap tab (AiTutorPage.tsx).",
            [
                ["Generate Roadmap", "Button", "Calls GET /api/student/ai/roadmap using the authenticated student's progress."],
                ["Analysis State", "Loading Panel", "Explains that AI is analyzing progress and scores."],
                ["Four-Week Plan", "Roadmap Cards", "Shows weekly focus, goals, recommended activities, and study guidance."],
                ["Raw Response Fallback", "Formatted Text", "Displays usable text if the AI response is not valid structured JSON."],
                ["Regenerate", "Button", "Requests a new roadmap from the latest progress snapshot."],
            ],
            [
                ["enrollments", "R", "Loads the student's courses and aggregate progress."],
                ["course_progress_items / student_video_progress", "R", "Summarizes completed content and watch progress."],
                ["quiz_attempts / exam_attempts", "R", "Summarizes assessment performance."],
                ["assignment_submissions", "R", "Includes assignment completion and grades in the progress context."],
            ],
            ["SELECT course_id, progress_pct FROM enrollments WHERE student_id = 'student-uuid' ORDER BY enrolled_at DESC;"],
        ),
    ))
    sections.append((
        "7.7 Answer Student Questions",
        build_design_section(
            templates,
            "7.6 Grade Assignment and Essay Answers",
            "Teachers review assignment submissions and exam essay answers, assign valid scores and feedback, audit grade changes, notify students, and trigger progress/certificate re-evaluation.",
            "UC35_GradeAssignment",
            "Teacher dashboard > Grades and assignment submissions (GradesPage.tsx).",
            [
                ["Submission / Attempt List", "Table/List", "Filters and opens student assignment submissions or exam attempts requiring grading."],
                ["Student Work", "Preview", "Shows text, attachments, submitted time, attempt number, and late status."],
                ["Score", "Number Input", "Accepts a score between zero and the configured maximum."],
                ["Feedback", "Textarea", "Records teacher feedback for the student."],
                ["Change Reason", "Input", "Required by the service for applicable score revisions and stored in the grade audit."],
                ["Save Grade", "Button", "Updates the grade, notifies the student, and recalculates related progress/certificate rules."],
            ],
            [
                ["assignment_submissions", "R/U", "Loads and grades assignment attempts."],
                ["exam_attempts", "R/U", "Loads and grades essay-containing exam attempts."],
                ["grade_audit_logs", "C", "Stores old/new score, grader, target, and reason."],
                ["course_progress_items", "C", "Marks assignment/exam passing completion where applicable."],
                ["certificates", "U", "Moves affected certificates through review/reissue/revocation evaluation."],
                ["user_notifications", "C", "Notifies the student of the grade or retake decision."],
            ],
            [
                "UPDATE assignment_submissions SET score = 85, feedback = 'Good work', graded_by = 'teacher-uuid', graded_at = NOW() WHERE id = 'submission-uuid';",
                "INSERT INTO grade_audit_logs(id, target_type, target_id, old_score, new_score, grader_id, reason) VALUES ('audit-uuid', 'ASSIGNMENT', 'submission-uuid', NULL, 85, 'teacher-uuid', 'Initial grading');",
            ],
        ),
    ))
    sections.append((
        "8. Admin",
        build_design_section(
            templates,
            "7.8 View Revenue History",
            "Teachers view revenue statistics, transaction-level revenue splits, and paid payout periods; confirmed-period details can be exported with transfer metadata.",
            "UC37_ViewRevenueHistory",
            "Teacher dashboard > Revenue (RevenuePage.tsx).",
            [
                ["Overview Statistics", "Cards", "Shows students, courses, current/previous month revenue, and sale counts."],
                ["Revenue Splits", "Table", "Shows student, course, order item, gross amount, platform fee, teacher amount, and occurrence date."],
                ["Paid Periods", "List/Table", "Shows only payout periods confirmed as PAID for the current teacher."],
                ["Period Detail", "Panel", "Shows source transactions and admin-recorded transfer reference, content, date, and evidence URL."],
                ["Export", "Button", "Exports confirmed period data in CSV and Excel-compatible format."],
            ],
            [
                ["revenue_splits", "R", "Loads immutable teacher/platform allocations and source transaction IDs."],
                ["payout_periods", "R", "Loads paid periods and transfer confirmation metadata for the teacher."],
                ["courses / profiles", "R", "Resolves course and student display names."],
                ["orders / order_items", "R", "Provides traceability back to the paid source transaction."],
            ],
            [
                "SELECT * FROM payout_periods WHERE teacher_id = 'teacher-uuid' AND status = 'PAID' ORDER BY month_year DESC;",
                "SELECT * FROM revenue_splits WHERE teacher_id = 'teacher-uuid' AND payout_period_id = 'period-uuid' ORDER BY occurred_at DESC;",
            ],
        ),
    ))
    sections.append((
        "8.4 Review and Approve Courses",
        build_design_section(
            templates,
            "8.2 View User Account List",
            "Admins view a paginated member list, search by name/email/ID, filter by role, and review role, join date, block state, and user statistics.",
            "UC39_ViewUserAccounts",
            "Admin dashboard > User Management tab (DashboardAdmin.tsx).",
            [
                ["User Statistics", "Badges/Cards", "Shows student, teacher, parent, and total account counts."],
                ["Search", "Input", "Searches by display name, email, or account identifier."],
                ["Role Filter", "Combo Box", "Filters all users, students, teachers, or parents."],
                ["User Table", "Table", "Displays avatar/name, email, role, created date, active/blocked state, and actions."],
                ["Pagination", "Controls", "Loads server-side pages from GET /api/admin/users."],
            ],
            [["profiles", "R", "Loads role, profile, block state, teacher approval state, and created date; email is joined from the auth schema query."],],
            ["SELECT id, full_name, role, is_blocked, teacher_approval_status, created_at FROM profiles ORDER BY created_at DESC;"],
        ) + build_design_section(
            templates,
            "8.3 Unlock and Lock User Accounts",
            "Admins block or unblock non-admin accounts, change application roles, and approve or reject teacher status through protected management endpoints.",
            "UC40_ManageUserAccounts",
            "Admin dashboard > User Management actions (DashboardAdmin.tsx).",
            [
                ["Role", "Combo Box", "Changes a non-admin account between student, teacher, and parent roles."],
                ["Block / Unblock", "Button", "Toggles the account block flag; admin accounts are protected from blocking."],
                ["Teacher Approval", "Action", "Updates teacher approval state to approved or rejected with an optional reason."],
                ["Status Badge", "Badge", "Shows Active or Blocked and refreshes after the API succeeds."],
                ["Confirmation / Error", "Toast", "Reports the result of sensitive account changes."],
            ],
            [["profiles", "R/U", "Reads and updates role, is_blocked, and teacher_approval_status."],],
            [
                "UPDATE profiles SET is_blocked = TRUE, updated_at = NOW() WHERE id = 'user-uuid' AND role <> 'admin';",
                "UPDATE profiles SET role = 'teacher', teacher_approval_status = 'pending', updated_at = NOW() WHERE id = 'user-uuid';",
            ],
        ),
    ))
    sections.append((
        "8.7 Send Notifications to Users",
        build_design_section(
            templates,
            "8.6 Confirm Teacher Bank Transfer",
            "Admins review teacher payout periods, hold periods until bank information is verified, export reconciliation data, and confirm a manual transfer with its reference and content.",
            "UC43_ConfirmTeacherTransfer",
            "Admin dashboard > Payouts & Reconciliation (PayoutsPanel.tsx).",
            [
                ["Payout Statistics", "Cards", "Shows monthly GMV, pending teacher amount, and platform revenue."],
                ["Bank Verification Queue", "List", "Approves or rejects pending teacher bank accounts before payout."],
                ["Search / Status Filter", "Controls", "Filters payout periods by teacher and paid/pending/overdue state."],
                ["Payout Table", "Table", "Shows teacher/bank, period, gross, teacher amount, status, and action."],
                ["Export", "Button", "Exports reconciliation data for accounting review."],
                ["Confirm Transfer", "Modal/Button", "Requires a bank transfer reference and optionally records transfer content/evidence."],
            ],
            [
                ["payout_periods", "R/U", "Loads reconciliation periods and marks an eligible period PAID with transfer metadata."],
                ["revenue_splits", "R", "Calculates gross, platform fee, and teacher amount per period."],
                ["teacher_bank_accounts", "R", "Requires verified teacher bank information before confirmation."],
                ["profiles", "R", "Resolves teacher display information."],
                ["user_notifications", "C", "Notifies the teacher after payout confirmation."],
            ],
            [
                "SELECT * FROM payout_periods ORDER BY month_year DESC, created_at DESC;",
                "UPDATE payout_periods SET status = 'PAID', paid_at = NOW(), paid_by_admin = 'admin-uuid', transfer_ref = 'BANK-REF-001', transfer_content = 'Teacher payout 2026-07' WHERE id = 'period-uuid';",
            ],
        ),
    ))

    # Insert sections after all locators were captured so occurrence-based template lookup remains stable.
    for anchor_text, elements in sections:
        insert_before(find_paragraph(root, anchor_text), elements)

    # Replace the template appendix wholesale.
    appendix_h2_source = find_paragraph(root, "1. Assumptions & Dependencies")
    appendix = find_paragraph(root, "IV. Appendix")
    body = appendix.getparent()
    assert body is not None
    sect_pr = body.find("w:sectPr", NS)
    current = appendix.getnext()
    while current is not None and current is not sect_pr:
        nxt = current.getnext()
        body.remove(current)
        current = nxt
    appendix_elements = [
        clone_paragraph(appendix_h2_source, "1. Assumptions & Dependencies"),
        *[clone_paragraph(templates["body"], item) for item in APPENDIX_ASSUMPTIONS],
        clone_paragraph(appendix_h2_source, "2. Limitations & Exclusions"),
        clone_table(templates["db_table"], LIMITATION_ROWS),
        clone_paragraph(appendix_h2_source, "3. Business Rules"),
        clone_table(templates["db_table"], BUSINESS_RULE_ROWS),
        clone_paragraph(appendix_h2_source, "4. Implementation Traceability"),
        clone_paragraph(templates["body"], "This matrix identifies the primary code areas used to validate and complete this RDS. Detailed endpoints and data operations are documented in the corresponding Design Specifications."),
        clone_table(templates["db_table"], TRACEABILITY_ROWS),
    ]
    insert_at = body.index(sect_pr) if sect_pr is not None else len(body)
    for element in appendix_elements:
        body.insert(insert_at, element)
        insert_at += 1

    # Request Word to refresh the TOC/PAGEREF cache when the document opens.
    settings = etree.fromstring(package["word/settings.xml"], parser)
    update_fields = settings.find("w:updateFields", NS)
    if update_fields is None:
        update_fields = etree.SubElement(settings, qn("updateFields"))
    update_fields.set(qn("val"), "true")

    package["word/document.xml"] = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone="yes")
    package["word/settings.xml"] = etree.tostring(settings, xml_declaration=True, encoding="UTF-8", standalone="yes")

    # Update core modified timestamp only; retain all other metadata.
    if "docProps/core.xml" in package:
        core = etree.fromstring(package["docProps/core.xml"], parser)
        ns_cp = {"dcterms": "http://purl.org/dc/terms/"}
        modified = core.find("dcterms:modified", ns_cp)
        if modified is not None:
            modified.text = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
        package["docProps/core.xml"] = etree.tostring(core, xml_declaration=True, encoding="UTF-8", standalone="yes")

    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w") as zout:
        for name, data in package.items():
            info = infos[name]
            new_info = zipfile.ZipInfo(filename=name, date_time=info.date_time)
            new_info.compress_type = info.compress_type
            new_info.external_attr = info.external_attr
            new_info.internal_attr = info.internal_attr
            new_info.flag_bits = info.flag_bits
            new_info.create_system = info.create_system
            zout.writestr(new_info, data)

    print(f"Wrote {output}")
    print(f"SHA256 {hashlib.sha256(output.read_bytes()).hexdigest().upper()}")


if __name__ == "__main__":
    main()
