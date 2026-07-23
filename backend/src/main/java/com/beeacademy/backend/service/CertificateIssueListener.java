package com.beeacademy.backend.service;

import com.beeacademy.backend.event.CertificateIssueRequestedEvent;
import com.beeacademy.backend.event.CertificateIssuedEvent;
import com.beeacademy.backend.event.RequiredExamGradeChangedEvent;
import com.beeacademy.backend.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Cấp chứng chỉ chỉ chạy SAU KHI transaction nghiệp vụ đã commit.
 *
 * Sinh PDF và upload lên Supabase là việc tốn thời gian và có thể lỗi. Nếu chạy chung
 * transaction với việc ghi tiến độ / nộp bài / chấm điểm thì một lỗi mạng sẽ rollback
 * luôn kết quả học tập của học sinh. Chạy sau commit khiến điều đó không thể xảy ra,
 * đồng thời đảm bảo truy vấn điều kiện đọc được dữ liệu vừa ghi.
 *
 * fallbackExecution=true: nếu người phát sự kiện quên mở transaction, chạy ngay thay vì
 * lặng lẽ bỏ qua — chứng chỉ không cấp được mà không có lỗi nào là thứ rất khó phát hiện.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CertificateIssueListener {

    private final CertificateService certificateService;
    private final CertificateEmailService certificateEmailService;
    private final ProfileRepository profileRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onIssueRequested(CertificateIssueRequestedEvent event) {
        try {
            certificateService.tryIssueAfterProgress(event.studentId(), event.courseId());
        } catch (Exception ex) {
            log.warn("Không cấp được chứng chỉ tự động cho student={} course={}",
                    event.studentId(), event.courseId(), ex);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onRequiredExamGradeChanged(RequiredExamGradeChangedEvent event) {
        try {
            certificateService.handleRequiredExamGradeChanged(event.examAttemptId());
        } catch (Exception ex) {
            log.warn("Không xử lý được thay đổi điểm bài kiểm tra bắt buộc attempt={}",
                    event.examAttemptId(), ex);
        }
    }

    /** Gửi mail chỉ sau khi chứng chỉ đã commit — tránh gửi mail cho một bản ghi bị rollback. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onCertificateIssued(CertificateIssuedEvent event) {
        try {
            String email = profileRepository.findEmailByUserId(event.studentId()).orElse(null);
            certificateEmailService.sendCertificate(
                    email,
                    event.studentName(),
                    event.courseTitle(),
                    event.certificateNo(),
                    event.verificationUrl(),
                    event.attachmentFileName(),
                    event.pdf(),
                    event.reissued());
        } catch (Exception ex) {
            log.warn("Không gửi được email chứng chỉ {} cho student={}",
                    event.certificateNo(), event.studentId(), ex);
        }
    }
}
