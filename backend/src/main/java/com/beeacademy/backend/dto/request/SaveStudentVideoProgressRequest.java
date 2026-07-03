package com.beeacademy.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SaveStudentVideoProgressRequest(
        @NotNull @Min(0) Integer positionSec,
        @NotNull @Min(0) Integer durationSec
) {
}
