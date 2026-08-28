package com.healthcare.clinic.ecommerce.controller;

import com.healthcare.clinic.ecommerce.entity.EcPayment;
import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import com.healthcare.clinic.ecommerce.service.CheckoutService;
import com.healthcare.clinic.ecommerce.service.PaymentService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ecommerce/checkout")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_PATIENT')")
public class EcCheckoutController {

    private final CheckoutService checkoutService;
    private final PaymentService paymentService;
    private final com.healthcare.clinic.ecommerce.service.CartService cartService;

    @PostMapping
    public ResponseEntity<EcommerceOrder> processCheckout(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = "X-Session-Key", required = false) String sessionKey,
            @RequestBody java.util.Map<String, Object> request) {
        
        Long patientId = user != null ? user.getUserId() : null;
        com.healthcare.clinic.ecommerce.entity.EcCart cart = cartService.getOrCreateCart(patientId, sessionKey);
        
        Long addressId = Long.valueOf(request.get("addressId").toString());
        
        // 1. Convert Cart to Order (locks cart, calculates totals)
        EcommerceOrder order = checkoutService.processCheckout(patientId, cart.getId(), addressId);
        
        // 2. Initiate Payment (generates idempotency key, provider ref)
        paymentService.initiatePayment(order);
        
        return ResponseEntity.ok(order);
    }
}
