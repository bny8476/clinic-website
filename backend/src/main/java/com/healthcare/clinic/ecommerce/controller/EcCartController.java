package com.healthcare.clinic.ecommerce.controller;

import com.healthcare.clinic.ecommerce.entity.EcCart;
import com.healthcare.clinic.ecommerce.service.CartService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ecommerce/cart")
@RequiredArgsConstructor
public class EcCartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<EcCart> getCart(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = "X-Session-Key", required = false) String sessionKey) {
        Long patientId = user != null ? user.getUserId() : null;
        return ResponseEntity.ok(cartService.getOrCreateCart(patientId, sessionKey));
    }

    @PostMapping("/items")
    public ResponseEntity<EcCart> addItem(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = "X-Session-Key", required = false) String sessionKey,
            @RequestBody java.util.Map<String, Object> request) {
        Long patientId = user != null ? user.getUserId() : null;
        EcCart cart = cartService.getOrCreateCart(patientId, sessionKey);
        Long productId = Long.valueOf(request.get("productId").toString());
        Integer quantity = Integer.valueOf(request.get("quantity").toString());
        return ResponseEntity.ok(cartService.addItemToCart(cart.getId(), productId, quantity));
    }

    @PostMapping("/merge")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<Void> mergeCart(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader("X-Session-Key") String sessionKey) {
        cartService.mergeSessionCart(user.getUserId(), sessionKey);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/{cartId}")
    public ResponseEntity<Void> clearCart(@PathVariable Long cartId) {
        cartService.clearCart(cartId);
        return ResponseEntity.ok().build();
    }
}
