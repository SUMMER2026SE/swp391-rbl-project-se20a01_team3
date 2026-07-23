package com.beeacademy.backend.service;

import jakarta.mail.util.ByteArrayDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Gửi chứng chỉ PDF về email học sinh ngay khi hệ thống cấp.
 *
 * <p>Giống {@link TeacherAccountEmailService}, hàm gửi KHÔNG ném exception khi thất bại.
 * Chứng chỉ đã cấp và đã lưu Storage trước khi gọi tới đây — SMTP hỏng không phải lý do
 * để huỷ chứng chỉ. Học sinh vẫn tải được ở trang /certificates.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateEmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /** @return true nếu email đã gửi đi; false nếu SMTP lỗi hoặc thiếu địa chỉ nhận. */
    public boolean sendCertificate(
            String email,
            String studentName,
            String courseTitle,
            String certificateNo,
            String verificationUrl,
            String attachmentFileName,
            byte[] pdf,
            boolean reissued) {

        if (email == null || email.isBlank()) {
            log.warn("Bỏ qua gửi chứng chỉ {} — không tìm thấy email học sinh", certificateNo);
            return false;
        }
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject(reissued
                    ? "Bee Academy - Chứng chỉ khóa học đã được cấp lại"
                    : "Bee Academy - Chúc mừng bạn đã nhận chứng chỉ!");
            helper.setText(buildHtml(studentName, courseTitle, certificateNo, verificationUrl, reissued), true);
            if (pdf != null && pdf.length > 0) {
                helper.addAttachment(
                        attachmentFileName == null || attachmentFileName.isBlank()
                                ? "certificate.pdf"
                                : attachmentFileName,
                        new ByteArrayDataSource(pdf, "application/pdf"));
            }
            mailSender.send(message);
            log.info("Đã gửi chứng chỉ {} tới {}", certificateNo, email);
            return true;
        } catch (Exception ex) {
            log.warn("Không gửi được chứng chỉ {} tới {}: {}", certificateNo, email, ex.getMessage());
            return false;
        }
    }

    private String buildHtml(
            String studentName,
            String courseTitle,
            String certificateNo,
            String verificationUrl,
            boolean reissued) {

        String greetingName = studentName == null || studentName.isBlank() ? "bạn" : studentName;
        String base = frontendUrl == null || frontendUrl.isBlank()
                ? "http://localhost:3000"
                : frontendUrl.replaceAll("/+$", "");
        String certificatesUrl = base + "/certificates";
        String lead = reissued
                ? "Chứng chỉ của bạn đã được cấp lại sau khi kết quả học tập được cập nhật. "
                  + "Bản đính kèm dưới đây thay thế cho bản trước đó."
                : "Bạn đã hoàn thành toàn bộ nội dung khóa học và đạt đủ các bài kiểm tra bắt buộc. "
                  + "Chứng chỉ của bạn được đính kèm trong email này.";

        return """
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fffaf5;border:1px solid #fde7d9;border-radius:18px;color:#1f2937">
              <div style="text-align:center;margin-bottom:24px">
                <h2 style="margin:0;color:#9a3412">Bee Academy</h2>
                <p style="margin:8px 0 0;color:#6b7280;font-size:14px">Chứng chỉ hoàn thành khóa học</p>
              </div>
              <p>Xin chào <strong>%s</strong>,</p>
              <p style="line-height:1.6">%s</p>
              <div style="margin:20px 0;padding:16px;background:#fff;border:1px solid #fde7d9;border-radius:12px">
                <p style="margin:0 0 8px">Khóa học: <strong>%s</strong></p>
                <p style="margin:0">Số hiệu: <strong style="font-family:monospace;letter-spacing:1px">%s</strong></p>
              </div>
              <div style="margin:24px 0;text-align:center">
                <a href="%s" style="display:inline-block;padding:12px 18px;background:#c2410c;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">
                  Xem chứng chỉ của tôi
                </a>
              </div>
              <p style="font-size:13px;color:#6b7280;line-height:1.6;padding:12px;background:#fff;border:1px solid #fde7d9;border-radius:10px">
                <strong>Chia sẻ chứng chỉ:</strong> bất kỳ ai cũng có thể kiểm tra tính xác thực tại
                <a href="%s" style="color:#c2410c">%s</a> mà không cần đăng nhập.
              </p>
              <p style="font-size:13px;color:#6b7280;line-height:1.6">
                Nếu bạn không thực hiện khóa học này, vui lòng báo lại cho Bee Academy.
              </p>
            </div>
            """.formatted(
                greetingName, lead, courseTitle, certificateNo,
                certificatesUrl, verificationUrl, verificationUrl);
    }
}
