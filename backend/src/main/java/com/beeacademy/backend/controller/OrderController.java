package com.beeacademy.backend.controller;

import com.beeacademy.backend.dto.request.CreateOrderRequest;
import com.beeacademy.backend.dto.response.ApiResponse;
import com.beeacademy.backend.dto.response.OrderResponse;
import com.beeacademy.backend.security.CurrentUser;
import com.beeacademy.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest req) {
        UUID userId = CurrentUser.required().userId();
        OrderResponse order = orderService.createOrder(userId, req);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @PathVariable UUID orderId) {
        UUID userId = CurrentUser.required().userId();
        OrderResponse order = orderService.getOrder(orderId, userId);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> listOrders() {
        UUID userId = CurrentUser.required().userId();
        return ResponseEntity.ok(ApiResponse.ok(orderService.listOrders(userId)));
    }
}
