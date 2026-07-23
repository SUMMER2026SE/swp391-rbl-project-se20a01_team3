package com.beeacademy.backend.event;

import java.util.UUID;

public record CertificateIssueRequestedEvent(UUID studentId, UUID courseId) {}
