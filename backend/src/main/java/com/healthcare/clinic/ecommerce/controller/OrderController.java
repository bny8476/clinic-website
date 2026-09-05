package com.healthcare.clinic.ecommerce.controller;

import com.healthcare.clinic.ecommerce.dto.OrderPlacementDto;
import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import com.healthcare.clinic.ecommerce.repository.EcommerceOrderRepository;
import com.healthcare.clinic.ecommerce.service.CheckoutService;
import com.healthcare.clinic.security.SecurityUtils;
import com.healthcare.clinic.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class OrderController {

    private final CheckoutService checkoutService;
    private final EcommerceOrderRepository orderRepository;

    @PostMapping
    public ResponseEntity<OrderPlacementDto.Response> placeOrder(
            @AuthenticationPrincipal UserPrincipal user,
            @Valid @RequestBody OrderPlacementDto.Request request) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(checkoutService.placeOrder(request, userId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<EcommerceOrder>> getMyOrders(
            @AuthenticationPrincipal UserPrincipal user) {
        Long userId = user != null ? user.getUserId() : SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(orderRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EcommerceOrder> getOrderDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal user) {
        EcommerceOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + id));
        return ResponseEntity.ok(order);
    }
}
