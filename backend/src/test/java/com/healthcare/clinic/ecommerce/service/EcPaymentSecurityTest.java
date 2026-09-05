package com.healthcare.clinic.ecommerce.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.clinic.ecommerce.controller.EcPaymentController;
import com.healthcare.clinic.ecommerce.entity.EcPayment;
import com.healthcare.clinic.ecommerce.entity.EcRefund;
import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import com.healthcare.clinic.ecommerce.repository.EcPaymentRepository;
import com.healthcare.clinic.ecommerce.repository.EcRefundRepository;
import com.healthcare.clinic.ecommerce.repository.EcommerceOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class EcPaymentSecurityTest {

    @Mock
    private EcPaymentRepository paymentRepository;

    @Mock
    private EcommerceOrderRepository orderRepository;

    @Mock
    private EcRefundRepository refundRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private OrderService orderService;

    @Mock
    private Environment environment;

    private ObjectMapper objectMapper = new ObjectMapper();

    private PaymentService paymentService;
    private RefundService refundService;
    private EcPaymentController paymentController;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                orderRepository,
                objectMapper,
                inventoryService,
                environment
        );

        refundService = new RefundService(
                refundRepository,
                orderService,
                paymentRepository,
                environment
        );

        paymentController = new EcPaymentController(
                paymentService,
                paymentRepository,
                environment
        );
    }

    @Test
    void testInitiatePayment_MockDisabledInProduction_ThrowsException() {
        ReflectionTestUtils.setField(paymentService, "paymentProvider", "MOCK");
        ReflectionTestUtils.setField(paymentService, "allowMock", false);
        ReflectionTestUtils.setField(paymentService, "paymentMode", "PRODUCTION");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

        EcommerceOrder order = EcommerceOrder.builder()
                .id(100L)
                .totalAmount(new BigDecimal("299.00"))
                .build();

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            paymentService.initiatePayment(order);
        });

        assertTrue(exception.getMessage().contains("strictly disabled in production profile"));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void testInitiateRefund_MockDisabledInProduction_ThrowsException() {
        ReflectionTestUtils.setField(refundService, "paymentProvider", "MOCK");
        ReflectionTestUtils.setField(refundService, "allowMock", false);
        ReflectionTestUtils.setField(refundService, "paymentMode", "PRODUCTION");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

        EcRefund savedRefund = EcRefund.builder().id(1L).build();
        when(refundRepository.save(any(EcRefund.class))).thenReturn(savedRefund);

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            refundService.initiateRefund(100L, null, new BigDecimal("299.00"), 10L);
        });

        assertTrue(exception.getMessage().contains("strictly disabled in production profile"));
    }

    @Test
    void testSimulateMockPayment_DisabledInProduction_ThrowsForbidden() {
        ReflectionTestUtils.setField(paymentController, "allowMock", false);
        ReflectionTestUtils.setField(paymentController, "paymentMode", "PRODUCTION");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

        Map<String, Object> req = new HashMap<>();
        req.put("orderId", 100L);
        req.put("status", "SUCCESS");

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            paymentController.simulateMockPayment(req);
        });

        assertEquals(403, exception.getStatusCode().value());
    }

    @Test
    void testInitiatePayment_MockAllowedInDev_Success() {
        ReflectionTestUtils.setField(paymentService, "paymentProvider", "MOCK");
        ReflectionTestUtils.setField(paymentService, "allowMock", true);
        ReflectionTestUtils.setField(paymentService, "paymentMode", "DEVELOPMENT");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        EcommerceOrder order = EcommerceOrder.builder()
                .id(100L)
                .totalAmount(new BigDecimal("299.00"))
                .build();

        EcPayment savedPayment = EcPayment.builder()
                .id(1L)
                .orderId(100L)
                .provider("MOCK")
                .providerRef("MOCK_TXN_12345678")
                .status("INITIATED")
                .build();

        when(paymentRepository.save(any(EcPayment.class))).thenReturn(savedPayment);

        EcPayment result = paymentService.initiatePayment(order);

        assertNotNull(result);
        assertEquals("MOCK", result.getProvider());
        verify(paymentRepository, times(1)).save(any());
    }
}
