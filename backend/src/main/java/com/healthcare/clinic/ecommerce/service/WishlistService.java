package com.healthcare.clinic.ecommerce.service;

import com.healthcare.clinic.ecommerce.entity.EcWishlist;
import com.healthcare.clinic.ecommerce.repository.EcWishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final EcWishlistRepository wishlistRepository;

    @Transactional(readOnly = true)
    public List<EcWishlist> getWishlist(Long patientId) {
        return wishlistRepository.findByPatientId(patientId);
    }

    @Transactional
    public void addOrUpdate(Long patientId, Long productId, boolean alertPriceDrop, boolean alertBackInStock) {
        Optional<EcWishlist> existing = wishlistRepository.findByPatientIdAndProductId(patientId, productId);

        if (existing.isPresent()) {
            EcWishlist w = existing.get();
            w.setAlertPriceDrop(alertPriceDrop);
            w.setAlertBackInStock(alertBackInStock);
            wishlistRepository.save(w);
        } else {
            wishlistRepository.save(EcWishlist.builder()
                    .patientId(patientId)
                    .productId(productId)
                    .alertPriceDrop(alertPriceDrop)
                    .alertBackInStock(alertBackInStock)
                    .build());
        }
    }

    @Transactional
    public void remove(Long patientId, Long productId) {
        wishlistRepository.findByPatientIdAndProductId(patientId, productId)
                .ifPresent(wishlistRepository::delete);
    }
}
