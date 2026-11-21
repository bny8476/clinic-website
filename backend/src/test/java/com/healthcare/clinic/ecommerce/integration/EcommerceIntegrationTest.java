package com.healthcare.clinic.ecommerce.integration;

import com.healthcare.clinic.ecommerce.entity.EcCart;
import com.healthcare.clinic.ecommerce.entity.EcCartItem;
import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import com.healthcare.clinic.ecommerce.entity.EcommerceProduct;
import com.healthcare.clinic.ecommerce.repository.EcCartRepository;
import com.healthcare.clinic.ecommerce.repository.EcommerceOrderRepository;
import com.healthcare.clinic.ecommerce.repository.EcommerceProductRepository;
import com.healthcare.clinic.ecommerce.service.CartService;
import com.healthcare.clinic.ecommerce.service.CheckoutService;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class EcommerceIntegrationTest {

    @Autowired
    private CartService cartService;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private EcommerceOrderRepository orderRepository;

    @Autowired
    private EcommerceProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EcCartRepository cartRepository;

    @Autowired
    private com.healthcare.clinic.ecommerce.repository.EcDeliveryAddressRepository addressRepository;

    private User testPatient;
    private EcommerceProduct testProduct;
    private com.healthcare.clinic.ecommerce.entity.EcDeliveryAddress testAddress;

    @Autowired
    private com.healthcare.clinic.ecommerce.repository.EcStockBatchRepository stockBatchRepository;

    @Autowired
    private com.healthcare.clinic.ecommerce.repository.EcTaxRuleRepository taxRuleRepository;

    @Autowired
    private com.healthcare.clinic.ecommerce.repository.EcDeliveryZoneRepository deliveryZoneRepository;

    @BeforeEach
    void setup() {
        testPatient = userRepository.save(User.builder()
                .email("ec_patient_" + System.nanoTime() + "@example.com")
                .passwordHash("password")
                .firstName("Test")
                .lastName("Patient")
                .enabled(true)
                .build());

        testProduct = productRepository.save(EcommerceProduct.builder()
                .title("Paracetamol 500mg")
                .sku("PAR-500")
                .price(new BigDecimal("50.00"))
                .taxClass("MEDICINE_12")
                .prescriptionRequired(false)
                .isActive(true)
                .productStatus("ACTIVE")
                .build());
                
        stockBatchRepository.save(com.healthcare.clinic.ecommerce.entity.EcStockBatch.builder()
                .productId(testProduct.getId())
                .batchNumber("BATCH-001")
                .quantityTotal(100)
                .quantityAvailable(100)
                .expiryDate(java.time.LocalDate.now().plusYears(1))
                .build());
                
        taxRuleRepository.save(com.healthcare.clinic.ecommerce.entity.EcTaxRule.builder()
                .taxClass("MEDICINE_12")
                .state("DELHI")
                .ratePercent(new BigDecimal("12.00"))
                .effectiveFrom(java.time.LocalDate.now().minusDays(1))
                .isActive(true)
                .build());

        taxRuleRepository.save(com.healthcare.clinic.ecommerce.entity.EcTaxRule.builder()
                .taxClass("STANDARD")
                .state("DELHI")
                .ratePercent(new BigDecimal("18.00"))
                .effectiveFrom(java.time.LocalDate.now().minusDays(1))
                .isActive(true)
                .build());
                
        deliveryZoneRepository.save(com.healthcare.clinic.ecommerce.entity.EcDeliveryZone.builder()
                .pincode("110001")
                .state("DELHI")
                .city("New Delhi")
                .minDeliveryDays(1)
                .maxDeliveryDays(2)
                .isServiceable(true)
                .baseShippingFee(new BigDecimal("50.00"))
                .build());
                
        testAddress = addressRepository.save(com.healthcare.clinic.ecommerce.entity.EcDeliveryAddress.builder()
                .patientId(testPatient.getId())
                .pincode("110001")
                .state("DELHI")
                .city("New Delhi")
                .addressLine1("123 Street")
                .recipientName("Test Patient")
                .recipientPhone("9999999999")
                .isServiceable(true)
                .build());
    }

    @Test
    void testCartToCheckoutFlow() {
        // Get or Create Cart
        EcCart cart = cartService.getOrCreateCart(testPatient.getId(), null);
        
        // Add to cart
        cart = cartService.addItemToCart(cart.getId(), testProduct.getId(), 2);
        
        assertNotNull(cart);
        assertEquals(1, cart.getItems().size());
        
        // Checkout
        EcommerceOrder order = checkoutService.processCheckout(testPatient.getId(), cart.getId(), testAddress.getId());
        
        assertNotNull(order);
        assertEquals("PENDING", order.getStatus());
        assertEquals("PENDING", order.getPaymentStatus());
        assertEquals(testPatient.getId(), order.getPatientId());
        
        // Check cart is checked out
        EcCart postCheckoutCart = cartService.getOrCreateCart(testPatient.getId(), null);
        assertNotEquals(cart.getId(), postCheckoutCart.getId()); // Should give a new active cart
    }

    @Test
    void testIdorOnCheckout() {
        assertThrows(Exception.class, () -> {
            checkoutService.processCheckout(9999L, 1L, testAddress.getId());
        });
    }
}
