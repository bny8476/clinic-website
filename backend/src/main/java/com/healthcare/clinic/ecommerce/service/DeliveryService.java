package com.healthcare.clinic.ecommerce.service;

import com.healthcare.clinic.ecommerce.entity.EcShipment;
import com.healthcare.clinic.ecommerce.entity.EcShipmentEvent;
import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import com.healthcare.clinic.ecommerce.repository.EcShipmentEventRepository;
import com.healthcare.clinic.ecommerce.repository.EcShipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.ZonedDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final EcShipmentRepository shipmentRepository;
    private final EcShipmentEventRepository shipmentEventRepository;
    private final OrderService orderService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public EcShipment createShipment(Long orderId) {
        EcommerceOrder order = orderService.getOrderDetails(orderId, orderId); // Bypass sec for internal
        
        EcShipment shipment = EcShipment.builder()
                .orderId(orderId)
                .deliveryAddressId(order.getAddressId())
                .status("READY")
                .trackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase())
                .otpRequired(true)
                .otpAttempts(0)
                .maxOtpAttempts(3)
                .build();
                
        return shipmentRepository.save(shipment);
    }

    @Transactional
    public String generateDeliveryOtp(Long shipmentId) {
        EcShipment shipment = shipmentRepository.findById(shipmentId).orElseThrow();
        String rawOtp = String.format("%06d", secureRandom.nextInt(1_000_000));
        
        shipment.setOtpHash(hashOtp(rawOtp));
        shipment.setOtpExpiresAt(ZonedDateTime.now().plusHours(24));
        shipment.setOtpAttempts(0);
        shipment.setMaxOtpAttempts(3);
        shipment.setOtpVerified(false);
        shipmentRepository.save(shipment);

        log.info("Secure delivery OTP generated for shipment ID: {}", shipmentId);
        return rawOtp;
    }

    @Transactional
    public String dispatchShipment(Long shipmentId, Long deliveryAgentId, String carrier) {
        EcShipment shipment = shipmentRepository.findById(shipmentId).orElseThrow();
        shipment.setAssignedTo(deliveryAgentId);
        shipment.setCarrier(carrier);
        shipment.setStatus("OUT_FOR_DELIVERY");
        shipment.setOutForDeliveryAt(ZonedDateTime.now());
        
        String generatedOtp = null;
        if (Boolean.TRUE.equals(shipment.getOtpRequired())) {
            generatedOtp = generateDeliveryOtp(shipmentId);
        } else {
            shipmentRepository.save(shipment);
        }

        logEvent(shipmentId, "DISPATCHED", "Out for delivery with " + carrier);
        orderService.updateOrderStatus(shipment.getOrderId(), "DISPATCHED", deliveryAgentId, "DELIVERY_AGENT", "Dispatched");
        return generatedOtp;
    }

    @Transactional
    public void markDelivered(Long shipmentId, Long deliveryAgentId, String proofUrl, String otp) {
        EcShipment shipment = shipmentRepository.findById(shipmentId).orElseThrow();
        
        if (Boolean.TRUE.equals(shipment.getOtpRequired())) {
            if (!Boolean.TRUE.equals(shipment.getOtpVerified())) {
                if (otp == null || otp.trim().isEmpty()) {
                    throw new IllegalArgumentException("OTP is required for delivery verification");
                }

                // 1. Expiration Check
                if (shipment.getOtpExpiresAt() != null && ZonedDateTime.now().isAfter(shipment.getOtpExpiresAt())) {
                    throw new IllegalStateException("Delivery OTP has expired. Please request a new OTP.");
                }

                // 2. Attempt Limit Check
                int currentAttempts = shipment.getOtpAttempts() != null ? shipment.getOtpAttempts() : 0;
                int maxAttempts = shipment.getMaxOtpAttempts() != null ? shipment.getMaxOtpAttempts() : 3;

                if (currentAttempts >= maxAttempts) {
                    throw new IllegalStateException("Maximum OTP verification attempts (" + maxAttempts + ") exceeded for shipment");
                }

                // 3. Hash Verification
                String inputHash = hashOtp(otp.trim());
                if (shipment.getOtpHash() == null || !shipment.getOtpHash().equalsIgnoreCase(inputHash)) {
                    int nextAttempts = currentAttempts + 1;
                    shipment.setOtpAttempts(nextAttempts);
                    shipmentRepository.save(shipment);
                    throw new IllegalArgumentException("Invalid OTP for delivery. Attempt " + nextAttempts + " of " + maxAttempts);
                }

                shipment.setOtpVerified(true);
            }
        }

        shipment.setStatus("DELIVERED");
        shipment.setDeliveredAt(ZonedDateTime.now());
        shipment.setProofOfDeliveryUrl(proofUrl);
        shipmentRepository.save(shipment);

        logEvent(shipmentId, "DELIVERED", "Delivered successfully");
        orderService.updateOrderStatus(shipment.getOrderId(), "DELIVERED", deliveryAgentId, "DELIVERY_AGENT", "Delivered");
    }

    private String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(otp.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash delivery OTP", e);
        }
    }

    private void logEvent(Long shipmentId, String type, String note) {
        shipmentEventRepository.save(EcShipmentEvent.builder()
                .shipmentId(shipmentId)
                .eventType(type)
                .notes(note)
                .build());
    }
}

