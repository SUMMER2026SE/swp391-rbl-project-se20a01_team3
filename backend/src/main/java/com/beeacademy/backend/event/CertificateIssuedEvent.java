package com.beeacademy.backend.event;

import java.util.UUID;

/**
 * PDF đi kèm trong sự kiện thay vì tải lại từ Storage: listener chạy sau commit nên
 * không cần chạm DB, và tránh thêm một vòng gọi mạng chỉ để lấy file vừa upload xong.
 */
public record CertificateIssuedEvent(
        UUID studentId,
        String studentName,
        String courseTitle,
        String certificateNo,
        String verificationUrl,
        String attachmentFileName,
        byte[] pdf,
        boolean reissued) {}
