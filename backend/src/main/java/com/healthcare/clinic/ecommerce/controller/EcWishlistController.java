package com.healthcare.clinic.ecommerce.controller;

import com.healthcare.clinic.ecommerce.entity.EcWishlist;
import com.healthcare.clinic.ecommerce.service.WishlistService;
import com.healthcare.clinic.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ecommerce/wishlist")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_PATIENT')")
public class EcWishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<EcWishlist>> getWishlist(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(wishlistService.getWishlist(user.getUserId()));
    }

    @PostMapping
    public ResponseEntity<Void> addOrUpdateWishlist(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam Long productId,
            @RequestParam(defaultValue = "false") boolean alertPriceDrop,
            @RequestParam(defaultValue = "false") boolean alertBackInStock) {
        wishlistService.addOrUpdate(user.getUserId(), productId, alertPriceDrop, alertBackInStock);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> removeFromWishlist(@AuthenticationPrincipal UserPrincipal user, @PathVariable Long productId) {
        wishlistService.remove(user.getUserId(), productId);
        return ResponseEntity.ok().build();
    }
}
