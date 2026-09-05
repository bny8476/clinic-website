package com.healthcare.clinic.ecommerce.service;

import com.healthcare.clinic.ecommerce.entity.EcShipment;
import com.healthcare.clinic.ecommerce.repository.EcShipmentEventRepository;
import com.healthcare.clinic.ecommerce.repository.EcShipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.ZonedDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class DeliveryOtpServiceTest {

    @Mock
    private EcShipmentRepository shipmentRepository;

    @Mock
    private EcShipmentEventRepository shipmentEventRepository;

    @Mock
    private OrderService orderService;

    private DeliveryService deliveryService;

    @BeforeEach
    void setUp() {
        deliveryService = new DeliveryService(shipmentRepository, shipmentEventRepository, orderService);
    }

    @Test
    void testDispatchShipment_Generates6DigitOtp() {
        EcShipment shipment = EcShipment.builder()
                .id(1L)
                .orderId(100L)
                .otpRequired(true)
                .status("READY")
                .build();

        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));
        when(shipmentRepository.save(any(EcShipment.class))).thenAnswer(i -> i.getArgument(0));

        String otp = deliveryService.dispatchShipment(1L, 10L, "FedEx");

        assertNotNull(otp);
        assertEquals(6, otp.length());
        assertTrue(otp.matches("\\d{6}"));
        assertNotNull(shipment.getOtpHash());
        assertNotNull(shipment.getOtpExpiresAt());
        assertEquals(0, shipment.getOtpAttempts());
    }

    @Test
    void testMarkDelivered_ValidOtp_Success() {
        EcShipment shipment = EcShipment.builder()
                .id(1L)
                .orderId(100L)
                .otpRequired(true)
                .status("OUT_FOR_DELIVERY")
                .build();

        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));
        when(shipmentRepository.save(any(EcShipment.class))).thenAnswer(i -> i.getArgument(0));

        String otp = deliveryService.dispatchShipment(1L, 10L, "FedEx");

        deliveryService.markDelivered(1L, 10L, "https://example.com/pod.jpg", otp);

        assertEquals("DELIVERED", shipment.getStatus());
        assertTrue(shipment.getOtpVerified());
        assertNotNull(shipment.getDeliveredAt());
    }

    @Test
    void testMarkDelivered_InvalidOtp_IncrementsAttempts() {
        EcShipment shipment = EcShipment.builder()
                .id(1L)
                .orderId(100L)
                .otpRequired(true)
                .status("OUT_FOR_DELIVERY")
                .build();

        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));
        when(shipmentRepository.save(any(EcShipment.class))).thenAnswer(i -> i.getArgument(0));

        deliveryService.dispatchShipment(1L, 10L, "FedEx");

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            deliveryService.markDelivered(1L, 10L, "https://example.com/pod.jpg", "000000");
        });

        assertTrue(exception.getMessage().contains("Invalid OTP for delivery. Attempt 1 of 3"));
        assertEquals(1, shipment.getOtpAttempts());
        assertFalse(shipment.getOtpVerified());
    }

    @Test
    void testMarkDelivered_MaxAttemptsExceeded_ThrowsException() {
        EcShipment shipment = EcShipment.builder()
                .id(1L)
                .orderId(100L)
                .otpRequired(true)
                .otpAttempts(3)
                .maxOtpAttempts(3)
                .status("OUT_FOR_DELIVERY")
                .build();

        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            deliveryService.markDelivered(1L, 10L, "https://example.com/pod.jpg", "123456");
        });

        assertTrue(exception.getMessage().contains("Maximum OTP verification attempts (3) exceeded"));
    }

    @Test
    void testMarkDelivered_ExpiredOtp_ThrowsException() {
        EcShipment shipment = EcShipment.builder()
                .id(1L)
                .orderId(100L)
                .otpRequired(true)
                .otpExpiresAt(ZonedDateTime.now().minusHours(1))
                .otpAttempts(0)
                .maxOtpAttempts(3)
                .status("OUT_FOR_DELIVERY")
                .build();

        when(shipmentRepository.findById(1L)).thenReturn(Optional.of(shipment));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            deliveryService.markDelivered(1L, 10L, "https://example.com/pod.jpg", "123456");
        });

        assertTrue(exception.getMessage().contains("Delivery OTP has expired"));
    }
}
