package com.beeacademy.backend.controller;

import com.beeacademy.backend.dto.response.ApiResponse;
import com.beeacademy.backend.dto.response.PayoutPeriodResponse;
import com.beeacademy.backend.dto.response.RevenueSplitResponse;
import com.beeacademy.backend.security.CurrentUser;
import com.beeacademy.backend.service.TeacherRevenueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teacher/revenue")
@RequiredArgsConstructor
public class TeacherRevenueController {

    private final TeacherRevenueService revenueService;

    @GetMapping("/splits")
    public ResponseEntity<ApiResponse<List<RevenueSplitResponse>>> getSplits() {
        UUID teacherId = CurrentUser.required().userId();
        return ResponseEntity.ok(ApiResponse.ok(revenueService.getSplits(teacherId)));
    }

    @GetMapping("/periods")
    public ResponseEntity<ApiResponse<List<PayoutPeriodResponse>>> getPeriods() {
        UUID teacherId = CurrentUser.required().userId();
        return ResponseEntity.ok(ApiResponse.ok(revenueService.getPeriods(teacherId)));
    }
}
