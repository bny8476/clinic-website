package com.healthcare.clinic.ecommerce.service;

import com.healthcare.clinic.ecommerce.entity.EcCart;
import com.healthcare.clinic.ecommerce.entity.EcCartItem;
import com.healthcare.clinic.ecommerce.entity.EcommerceProduct;
import com.healthcare.clinic.ecommerce.repository.EcCartItemRepository;
import com.healthcare.clinic.ecommerce.repository.EcCartRepository;
import com.healthcare.clinic.ecommerce.repository.EcommerceProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final EcCartRepository cartRepository;
    private final EcCartItemRepository cartItemRepository;
    private final EcommerceProductRepository productRepository;
    private final InventoryService inventoryService;

    @Transactional
    public EcCart getOrCreateCart(Long patientId, String sessionKey) {
        if (patientId != null) {
            Optional<EcCart> patientCart = cartRepository.findByPatientIdAndStatus(patientId, "ACTIVE");
            if (patientCart.isPresent()) return patientCart.get();
        }

        if (sessionKey != null) {
            Optional<EcCart> sessionCart = cartRepository.findBySessionKeyAndStatus(sessionKey, "ACTIVE");
            if (sessionCart.isPresent()) return sessionCart.get();
        }

        return cartRepository.save(EcCart.builder()
                .patientId(patientId)
                .sessionKey(sessionKey != null ? sessionKey : UUID.randomUUID().toString())
                .status("ACTIVE")
                .expiresAt(ZonedDateTime.now().plusDays(7))
                .build());
    }

    @Transactional
    public EcCart addItemToCart(Long cartId, Long productId, int quantity) {
        EcCart cart = cartRepository.findById(cartId).orElseThrow();
        EcommerceProduct product = productRepository.findById(productId).orElseThrow();

        if (!"ACTIVE".equals(product.getProductStatus())) {
            throw new IllegalStateException("Product is not available for sale");
        }

        Optional<EcCartItem> existingItem = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst();

        int requestedQty = existingItem.map(i -> i.getQuantity() + quantity).orElse(quantity);
        
        // Attempt stock reservation
        inventoryService.reserveStockForCart(cartId, productId, quantity);

        if (existingItem.isPresent()) {
            EcCartItem item = existingItem.get();
            item.setQuantity(requestedQty);
            item.setPriceSnapshot(product.getPrice());
            item.setMrpSnapshot(product.getMrp());
            cartItemRepository.save(item);
        } else {
            EcCartItem newItem = EcCartItem.builder()
                    .cart(cart)
                    .productId(productId)
                    .quantity(quantity)
                    .priceSnapshot(product.getPrice())
                    .mrpSnapshot(product.getMrp())
                    .build();
            cartItemRepository.save(newItem);
            cart.getItems().add(newItem);
        }

        return cartRepository.save(cart);
    }

    @Transactional
    public void mergeSessionCart(Long patientId, String sessionKey) {
        EcCart sessionCart = cartRepository.findBySessionKeyAndStatus(sessionKey, "ACTIVE").orElse(null);

        if (sessionCart == null || sessionCart.getItems().isEmpty()) return;

        EcCart patientCart = getOrCreateCart(patientId, null);

        for (EcCartItem sessionItem : sessionCart.getItems()) {
            addItemToCart(patientCart.getId(), sessionItem.getProductId(), sessionItem.getQuantity());
        }

        sessionCart.setStatus("MERGED");
        sessionCart.setMergedIntoCartId(patientCart.getId());
        cartRepository.save(sessionCart);
    }

    @Transactional
    public void clearCart(Long cartId) {
        EcCart cart = cartRepository.findById(cartId).orElseThrow();
        cart.getItems().clear();
        cart.setStatus("CHECKED_OUT");
        cartRepository.save(cart);
    }
}
