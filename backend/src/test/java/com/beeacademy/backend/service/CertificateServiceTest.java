package com.beeacademy.backend.service;

import com.beeacademy.backend.client.SupabaseStorageClient;
import com.beeacademy.backend.event.CertificateIssuedEvent;
import com.beeacademy.backend.exception.BusinessException;
import com.beeacademy.backend.model.Certificate;
import com.beeacademy.backend.model.CertificateStatus;
import com.beeacademy.backend.model.Course;
import com.beeacademy.backend.model.Enrollment;
import com.beeacademy.backend.model.ExamAttempt;
import com.beeacademy.backend.model.ExamConfig;
import com.beeacademy.backend.model.Profile;
import com.beeacademy.backend.repository.CertificateRepository;
import com.beeacademy.backend.repository.CourseRepository;
import com.beeacademy.backend.repository.EnrollmentRepository;
import com.beeacademy.backend.repository.ExamAttemptRepository;
import com.beeacademy.backend.repository.ProfileRepository;
import com.beeacademy.backend.security.AuthenticatedUser;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.text.Normalizer;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateServiceTest {

    private static final int REQUIRED_EXAMS = CertificateEligibilityService.REQUIRED_EXAM_COUNT;

    @Mock CertificateRepository certificateRepository;
    @Mock EnrollmentRepository enrollmentRepository;
    @Mock CourseRepository courseRepository;
    @Mock ProfileRepository profileRepository;
    @Mock ExamAttemptRepository examAttemptRepository;
    @Mock CertificateEligibilityService certificateEligibilityService;
    @Mock SupabaseStorageClient storageClient;
    @Mock org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks CertificateService service;

    /** PDF co the bi bo dau khi may chay test khong co font Unicode — so sanh ban da bo dau cho on dinh. */
    private static String withoutDiacritics(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D');
    }

    @Test
    void finalExamGradeChangeRecalculatesAndRevokesCertificate() {
        UUID studentId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        Enrollment enrollment = Enrollment.create(studentId, courseId, UUID.randomUUID());
        Profile student = mock(Profile.class);
        Course course = mock(Course.class);
        ExamConfig changedConfig = mock(ExamConfig.class);
        ExamAttempt changedAttempt = mock(ExamAttempt.class);
        ExamAttempt finalAttempt = mock(ExamAttempt.class);
        when(student.getId()).thenReturn(studentId);
        when(course.getId()).thenReturn(courseId);
        when(changedConfig.getCourse()).thenReturn(course);
        when(changedAttempt.getStudent()).thenReturn(student);
        when(changedAttempt.getExamConfig()).thenReturn(changedConfig);

        Certificate certificate = Certificate.pending(student, course);
        certificate.issue(finalAttempt, "certificates/original.pdf", false);
        when(examAttemptRepository.findById(attemptId)).thenReturn(Optional.of(changedAttempt));
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.of(enrollment));
        when(certificateEligibilityService.isRequiredExamAttempt(enrollment, changedAttempt))
                .thenReturn(true);
        when(certificateRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.of(certificate));
        when(certificateEligibilityService.evaluate(enrollment))
                .thenReturn(new CertificateEligibilityService.Eligibility(
                        true, false, false, null, Set.of(), REQUIRED_EXAMS));

        service.handleRequiredExamGradeChanged(attemptId);

        assertThat(certificate.getStatus()).isEqualTo(CertificateStatus.REVOKED);
        verify(certificateRepository, times(1)).save(certificate);
    }

    @Test
    void gradeChangeFromAnotherCourseVersionDoesNotTouchCertificate() {
        UUID studentId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        Enrollment enrollment = Enrollment.create(studentId, courseId, UUID.randomUUID());
        Profile student = mock(Profile.class);
        Course course = mock(Course.class);
        ExamConfig config = mock(ExamConfig.class);
        ExamAttempt attempt = mock(ExamAttempt.class);
        when(student.getId()).thenReturn(studentId);
        when(course.getId()).thenReturn(courseId);
        when(config.getCourse()).thenReturn(course);
        when(attempt.getStudent()).thenReturn(student);
        when(attempt.getExamConfig()).thenReturn(config);
        when(examAttemptRepository.findById(attemptId)).thenReturn(Optional.of(attempt));
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.of(enrollment));
        when(certificateEligibilityService.isRequiredExamAttempt(enrollment, attempt))
                .thenReturn(false);

        service.handleRequiredExamGradeChanged(attemptId);

        verify(certificateRepository, never()).findByStudentIdAndCourseId(studentId, courseId);
    }

    @Test
    void requestIssueExplainsThatAllFourRequiredExamsAreRequired() {
        UUID studentId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Enrollment enrollment = Enrollment.create(studentId, courseId, UUID.randomUUID());
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.of(enrollment));
        when(certificateEligibilityService.evaluate(enrollment))
                .thenReturn(new CertificateEligibilityService.Eligibility(
                        true, false, false, null, Set.of(), REQUIRED_EXAMS));

        assertThatThrownBy(() -> service.requestIssue(
                courseId,
                new AuthenticatedUser(studentId, "student@example.com", "student")))
                .isInstanceOfSatisfying(BusinessException.class, ex -> {
                    assertThat(ex.getCode()).isEqualTo("CERTIFICATE_NOT_ELIGIBLE");
                    assertThat(ex.getMessage()).contains(REQUIRED_EXAMS + " bài kiểm tra bắt buộc");
                });
    }

    @Test
    void requestIssueBlamesTheCourseWhenItHasTooFewRequiredExams() {
        UUID studentId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Enrollment enrollment = Enrollment.create(studentId, courseId, UUID.randomUUID());
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.of(enrollment));
        when(certificateEligibilityService.evaluate(enrollment))
                .thenReturn(new CertificateEligibilityService.Eligibility(
                        true, false, false, null, Set.of(), 2));

        assertThatThrownBy(() -> service.requestIssue(
                courseId,
                new AuthenticatedUser(studentId, "student@example.com", "student")))
                .isInstanceOfSatisfying(BusinessException.class, ex -> {
                    assertThat(ex.getCode()).isEqualTo("COURSE_MISSING_REQUIRED_EXAMS");
                    assertThat(ex.getMessage()).contains("2/" + REQUIRED_EXAMS);
                    assertThat(ex.getMessage()).contains("liên hệ giáo viên");
                });
    }

    @Test
    void issuedCertificatePdfIsWrittenInVietnamese() throws Exception {
        UUID studentId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Enrollment enrollment = Enrollment.create(studentId, courseId, UUID.randomUUID());
        Profile student = mock(Profile.class);
        Profile teacher = mock(Profile.class);
        Course course = mock(Course.class);
        ExamAttempt finalAttempt = mock(ExamAttempt.class);

        when(student.getFullName()).thenReturn("Nguyễn Văn An");
        when(teacher.getFullName()).thenReturn("Nguyễn Thị Lan");
        when(course.getId()).thenReturn(courseId);
        when(course.getTitle()).thenReturn("Toán lớp 8");
        when(course.getSlug()).thenReturn("toan-lop-8");
        when(course.getTeacher()).thenReturn(teacher);
        when(finalAttempt.getEffectiveScorePercent()).thenReturn(java.math.BigDecimal.valueOf(85));
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.of(enrollment));
        when(certificateEligibilityService.evaluate(enrollment))
                .thenReturn(new CertificateEligibilityService.Eligibility(
                        true, true, true, finalAttempt, Set.of(), REQUIRED_EXAMS));
        when(profileRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(courseRepository.findWithCategoryAndTeacherById(courseId)).thenReturn(Optional.of(course));
        when(certificateRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.empty());
        when(certificateRepository.save(any(Certificate.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.requestIssue(courseId,
                new AuthenticatedUser(studentId, "student@example.com", "student"));

        ArgumentCaptor<byte[]> pdfCaptor = ArgumentCaptor.forClass(byte[].class);
        verify(storageClient).upload(
                eq("certificates"), anyString(), eq("application/pdf"), pdfCaptor.capture());
        PdfReader reader = new PdfReader(pdfCaptor.getValue());
        String pdfText = withoutDiacritics(new PdfTextExtractor(reader).getTextFromPage(1));
        reader.close();

        assertThat(pdfText).contains("CHUNG CHI HOAN THANH KHOA HOC");
        assertThat(pdfText).contains("Giao vien: Nguyen Thi Lan");
        assertThat(pdfText).contains("Nguyen Van An");
        assertThat(pdfText).contains(REQUIRED_EXAMS + " bai kiem tra bat buoc");
        assertThat(pdfText).doesNotContain("Teacher:");
    }

    @Test
    void issuingACertificatePublishesTheEmailEventWithThePdfAttached() {
        UUID studentId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Enrollment enrollment = Enrollment.create(studentId, courseId, UUID.randomUUID());
        Profile student = mock(Profile.class);
        Course course = mock(Course.class);
        ExamAttempt finalAttempt = mock(ExamAttempt.class);

        when(student.getFullName()).thenReturn("Nguyễn Văn An");
        when(course.getId()).thenReturn(courseId);
        when(course.getTitle()).thenReturn("Toán lớp 8");
        when(course.getSlug()).thenReturn("toan-lop-8");
        when(enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.of(enrollment));
        when(certificateEligibilityService.evaluate(enrollment))
                .thenReturn(new CertificateEligibilityService.Eligibility(
                        true, true, true, finalAttempt, Set.of(), REQUIRED_EXAMS));
        when(profileRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(courseRepository.findWithCategoryAndTeacherById(courseId)).thenReturn(Optional.of(course));
        when(certificateRepository.findByStudentIdAndCourseId(studentId, courseId))
                .thenReturn(Optional.empty());
        when(certificateRepository.save(any(Certificate.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        service.requestIssue(courseId,
                new AuthenticatedUser(studentId, "student@example.com", "student"));

        ArgumentCaptor<CertificateIssuedEvent> eventCaptor =
                ArgumentCaptor.forClass(CertificateIssuedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        CertificateIssuedEvent event = eventCaptor.getValue();

        assertThat(event.studentId()).isEqualTo(studentId);
        assertThat(event.courseTitle()).isEqualTo("Toán lớp 8");
        assertThat(event.reissued()).isFalse();
        assertThat(event.pdf()).isNotEmpty();
        assertThat(event.attachmentFileName()).endsWith(".pdf");
        assertThat(event.verificationUrl()).contains("/certificates/verify/");
    }
}
