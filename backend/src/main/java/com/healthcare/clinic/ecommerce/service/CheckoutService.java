package com.healthcare.clinic.ecommerce.service;

import com.healthcare.clinic.ecommerce.dto.OrderPlacementDto;
import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import com.healthcare.clinic.ecommerce.entity.EcommerceOrderItem;
import com.healthcare.clinic.ecommerce.entity.EcommerceProduct;
import com.healthcare.clinic.ecommerce.repository.EcommerceOrderItemRepository;
import com.healthcare.clinic.ecommerce.repository.EcommerceOrderRepository;
import com.healthcare.clinic.ecommerce.repository.EcommerceProductRepository;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.notification.service.InAppNotificationService;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@Slf4j
@RequiredArgsConstructor
public class CheckoutService {

    private final EcommerceProductRepository productRepository;
    private final EcommerceOrderRepository orderRepository;
    private final EcommerceOrderItemRepository orderItemRepository;
    private final InAppNotificationService notificationService;
    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final CartService cartService;

    private static final Random RANDOM = new Random();

    @Transactional
    public OrderPlacementDto.Response placeOrder(OrderPlacementDto.Request request, Long patientUserId) {
        log.info("Processing order placement for patient user ID: {}", patientUserId);

        // Fetch patient profile name if available
        String patientName = request.getPatientName();
        String patientIdCode = "PAT-" + patientUserId;
        if (patientUserId != null) {
            User user = userRepository.findById(patientUserId).orElse(null);
            if (user != null && (patientName == null || patientName.isBlank())) {
                patientName = user.getFirstName() + " " + user.getLastName();
            }
            PatientProfile profile = patientProfileRepository.findByUserId(patientUserId).orElse(null);
            if (profile != null) {
                patientIdCode = "PAT-" + profile.getId();
            }
        }
        if (patientName == null || patientName.isBlank()) {
            patientName = "Patient #" + patientUserId;
        }

        // Validate items and calculate totals server-side
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        List<EcommerceOrderItem> orderItemsToSave = new ArrayList<>();
        Long primaryDoctorId = null;

        for (OrderPlacementDto.CartItemRequest itemReq : request.getItems()) {
            EcommerceProduct product = productRepository.findById(itemReq.getMedicineId())
                    .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + itemReq.getMedicineId()));

            if (Boolean.FALSE.equals(product.getIsActive())) {
                throw new IllegalStateException("Medicine '" + product.getTitle() + "' is currently inactive.");
            }

            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new IllegalStateException("Insufficient stock for medicine '" + product.getTitle() + "'. Available: " 
                        + product.getStockQuantity() + ", requested: " + itemReq.getQuantity());
            }

            // Server-side price calculation
            BigDecimal unitPrice = product.getPrice();
            BigDecimal discountPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : unitPrice;
            BigDecimal itemSubtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            BigDecimal itemDiscount = unitPrice.subtract(discountPrice).multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            if (itemDiscount.compareTo(BigDecimal.ZERO) < 0) itemDiscount = BigDecimal.ZERO;

            BigDecimal taxRate = product.getTaxPercentage() != null ? product.getTaxPercentage() : BigDecimal.ZERO;
            BigDecimal itemTax = discountPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()))
                    .multiply(taxRate).divide(BigDecimal.valueOf(100));

            BigDecimal itemTotal = discountPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity())).add(itemTax);

            subtotal = subtotal.add(itemSubtotal);
            totalDiscount = totalDiscount.add(itemDiscount);
            totalTax = totalTax.add(itemTax);

            // Deduct stock safely inside transaction
            product.setStockQuantity(product.getStockQuantity() - itemReq.getQuantity());
            if (product.getStockQuantity() <= 0) {
                product.setProductStatus("OUT_OF_STOCK");
            }
            productRepository.save(product);

            if (primaryDoctorId == null && product.getDoctorId() != null) {
                primaryDoctorId = product.getDoctorId();
            }

            orderItemsToSave.add(EcommerceOrderItem.builder()
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(itemTotal)
                    .discountAmount(itemDiscount)
                    .taxAmount(itemTax)
                    .productNameSnapshot(product.getTitle())
                    .medicineNameSnapshot(product.getTitle())
                    .prescriptionRequired(Boolean.TRUE.equals(product.getPrescriptionRequired()))
                    .build());
        }

        BigDecimal grandTotal = subtotal.subtract(totalDiscount).add(totalTax);
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) grandTotal = BigDecimal.ZERO;

        // Generate unique order number MED-YYYYMMDD-XXXXXX
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = String.format("%06d", RANDOM.nextInt(1000000));
        String orderNumber = "MED-" + datePart + "-" + randomPart;

        EcommerceOrder order = EcommerceOrder.builder()
                .orderNumber(orderNumber)
                .userId(patientUserId)
                .patientId(patientUserId)
                .doctorId(primaryDoctorId)
                .subtotal(subtotal)
                .discountAmount(totalDiscount)
                .taxAmount(totalTax)
                .totalAmount(grandTotal)
                .shippingAddress(request.getShippingAddress() != null ? request.getShippingAddress() : "Default Delivery Address")
                .shippingCity(request.getShippingCity() != null ? request.getShippingCity() : "City")
                .postalCode(request.getPostalCode() != null ? request.getPostalCode() : "100001")
                .status("PENDING")
                .paymentStatus("PAID") // Default to PAID or PENDING for e-commerce checkout workflow
                .build();

        EcommerceOrder savedOrder = orderRepository.save(order);

        for (EcommerceOrderItem item : orderItemsToSave) {
            item.setOrder(savedOrder);
            orderItemRepository.save(item);
        }

        savedOrder.setItems(orderItemsToSave);

        // 🔔 Push Doctor Notification (Real-Time SSE + Database)
        String firstMedName = orderItemsToSave.get(0).getMedicineNameSnapshot();
        int totalQty = orderItemsToSave.stream().mapToInt(EcommerceOrderItem::getQuantity).sum();
        String doctorNotifyMessage = String.format(
                "Patient: %s (%s) | Order: %s\nMedicine: %s (Qty: %d)\nTotal: ₹%.2f | Status: Pending",
                patientName, patientIdCode, orderNumber, firstMedName, totalQty, grandTotal
        );

        if (primaryDoctorId != null) {
            notificationService.sendToUser(
                    primaryDoctorId,
                    "🔔 New Medicine Order",
                    doctorNotifyMessage,
                    "MEDICINE_ORDER",
                    "ORDER",
                    savedOrder.getId()
            );
        } else {
            // Broadcast to all doctors/pharmacists if no specific prescriber doctor ID on product
            notificationService.sendToRole(
                    "ROLE_DOCTOR",
                    "🔔 New Medicine Order",
                    doctorNotifyMessage,
                    "MEDICINE_ORDER",
                    "ORDER",
                    savedOrder.getId()
            );
        }

        // 🔔 Push Patient Notification
        notificationService.sendToUser(
                patientUserId,
                "Order Placed Successfully",
                "Your medicine order " + orderNumber + " for ₹" + grandTotal.setScale(2) + " has been placed.",
                "MEDICINE_ORDER",
                "ORDER",
                savedOrder.getId()
        );

        log.info("Order {} created successfully with ID {}", orderNumber, savedOrder.getId());

        List<OrderPlacementDto.ItemResponse> itemResponses = orderItemsToSave.stream()
                .map(i -> OrderPlacementDto.ItemResponse.builder()
                        .itemId(i.getId())
                        .medicineId(i.getProduct().getId())
                        .medicineName(i.getMedicineNameSnapshot())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .totalPrice(i.getTotalPrice())
                        .build())
                .toList();

        return OrderPlacementDto.Response.builder()
                .orderId(savedOrder.getId())
                .orderNumber(savedOrder.getOrderNumber())
                .patientId(patientUserId)
                .patientName(patientName)
                .subtotal(subtotal)
                .discountAmount(totalDiscount)
                .taxAmount(totalTax)
                .totalAmount(grandTotal)
                .status(savedOrder.getStatus())
                .paymentStatus(savedOrder.getPaymentStatus())
                .shippingAddress(savedOrder.getShippingAddress())
                .items(itemResponses)
                .createdAt(savedOrder.getCreatedAt())
                .build();
    }

    @Transactional
    public EcommerceOrder processCheckout(Long patientId, Long cartId, Long addressId) {
        log.info("Legacy processCheckout invoked for patientId: {}, cartId: {}", patientId, cartId);
        EcommerceOrder order = EcommerceOrder.builder()
                .userId(patientId)
                .patientId(patientId)
                .orderNumber("MED-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + String.format("%06d", RANDOM.nextInt(1000000)))
                .status("PENDING")
                .paymentStatus("PAID")
                .shippingAddress("Default Address")
                .shippingCity("City")
                .postalCode("100001")
                .totalAmount(BigDecimal.ZERO)
                .build();
        return orderRepository.save(order);
    }
}
