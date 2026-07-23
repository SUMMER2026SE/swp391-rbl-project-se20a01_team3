package com.beeacademy.backend.event;

import java.util.UUID;

public record RequiredExamGradeChangedEvent(UUID examAttemptId) {}
