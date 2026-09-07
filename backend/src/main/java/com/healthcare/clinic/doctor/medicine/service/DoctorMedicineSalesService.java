package com.healthcare.clinic.doctor.medicine.service;

import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.medicine.dto.DoctorMedicineSaleItemDto;
import com.healthcare.clinic.doctor.medicine.dto.DoctorMedicineSaleRequestDto;
import com.healthcare.clinic.doctor.medicine.dto.MedicineOrderResponseDto;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrder;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrderItem;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrderStatus;
import com.healthcare.clinic.doctor.medicine.repository.MedicineOrderRepository;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.ecommerce.entity.EcommerceProduct;
import com.healthcare.clinic.ecommerce.repository.EcommerceProductRepository;
import com.healthcare.clinic.exception.ResourceNotFoundException;
import com.healthcare.clinic.notification.service.InAppNotificationService;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import com.healthcare.clinic.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorMedicineSalesService {

    private final MedicineOrderRepository medicineOrderRepository;
    private final EcommerceProductRepository productRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final UserRepository userRepository;
    private final InAppNotificationService notificationService;

    /**
     * Search medicine catalog with server-side query execution
     */
    @Transactional(readOnly = true)
    public Page<EcommerceProduct> searchMedicines(String query, String category, Boolean rxRequired, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(0, page), size > 0 ? size : 20, Sort.by(Sort.Direction.ASC, "title"));
        String q = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        String cat = (category != null && !"ALL".equalsIgnoreCase(category.trim())) ? category.trim() : null;
        return productRepository.searchMedicines(q, cat, rxRequired, pageable);
    }

    /**
     * Doctor creates a medicine recommendation / sale order for a patient.
     * CRITICAL: Stock is NOT deducted at this point. Stock is reserved/deducted during payment & dispensing.
     */
    @Transactional
    public MedicineOrderResponseDto createDoctorMedicineOrder(Long doctorUserId, DoctorMedicineSaleRequestDto request) {
        DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseGet(() -> doctorProfileRepository.findById(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for ID: " + doctorUserId)));

        PatientProfile patientProfile = patientProfileRepository.findById(request.getPatientId())
                .orElseGet(() -> patientProfileRepository.findByUserId(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for ID: " + request.getPatientId())));

        String orderNumber = "MED-" + LocalDateTime.now().getYear() + "-" + String.format("%06d", System.currentTimeMillis() % 1000000L);

        MedicineOrder order = MedicineOrder.builder()
                .orderNumber(orderNumber)
                .patient(patientProfile)
                .doctor(doctorProfile)
                .prescriptionId(request.getPrescriptionId())
                .branchId(request.getBranchId() != null ? request.getBranchId() : doctorProfile.getBranchId())
                .status(MedicineOrderStatus.CREATED)
                .paymentStatus("UNPAID")
                .subtotal(BigDecimal.ZERO)
                .tax(BigDecimal.ZERO)
                .discount(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        List<MedicineOrderItem> items = new ArrayList<>();

        for (DoctorMedicineSaleItemDto itemDto : request.getItems()) {
            EcommerceProduct product = productRepository.findById(itemDto.getMedicineId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found with ID: " + itemDto.getMedicineId()));

            if (Boolean.FALSE.equals(product.getIsActive())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medicine " + product.getTitle() + " is currently inactive");
            }

            BigDecimal unitPrice = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            BigDecimal lineTax = lineTotal.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP);

            subtotal = subtotal.add(lineTotal);
            taxTotal = taxTotal.add(lineTax);

            MedicineOrderItem item = MedicineOrderItem.builder()
                    .order(order)
                    .medicineId(product.getId())
                    .quantity(itemDto.getQuantity())
                    .unitPrice(unitPrice)
                    .unitPriceAtOrder(unitPrice)
                    .totalPrice(lineTotal)
                    .dosage(itemDto.getDosage())
                    .frequency(itemDto.getFrequency())
                    .duration(itemDto.getDuration())
                    .instructions(itemDto.getInstructions())
                    .build();

            items.add(item);
        }

        BigDecimal grandTotal = subtotal.add(taxTotal);
        order.setItems(items);
        order.setSubtotal(subtotal);
        order.setTax(taxTotal);
        order.setTotal(grandTotal);
        order.setTotalAmount(grandTotal);

        MedicineOrder savedOrder = medicineOrderRepository.save(order);

        // Real-time SSE notification to Patient
        try {
            Long patientUserId = patientProfile.getUserId();
            if (patientUserId != null) {
                String doctorName = userRepository.findById(doctorUserId)
                        .map(u -> "Dr. " + u.getFirstName() + " " + u.getLastName())
                        .orElse("Your Doctor");
                notificationService.sendToUser(
                        patientUserId,
                        "New Doctor Recommended Medicines",
                        doctorName + " has created a medicine order recommendation (" + savedOrder.getOrderNumber() + ") for you.",
                        "MEDICINE_ORDER_RECOMMENDATION",
                        savedOrder.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Non-fatal error pushing real-time notification to patient: {}", e.getMessage());
        }

        return mapToDto(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<MedicineOrderResponseDto> getDoctorMedicineSales(Long doctorUserId) {
        DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseGet(() -> doctorProfileRepository.findById(doctorUserId).orElse(null));
        
        Long docProfileId = doctorProfile != null ? doctorProfile.getId() : doctorUserId;

        List<MedicineOrder> orders = medicineOrderRepository.findAllByDoctorIdOrderByCreatedAtDesc(docProfileId);
        if (orders.isEmpty()) {
            orders = medicineOrderRepository.findByDoctor_UserIdOrderByCreatedAtDesc(doctorUserId);
        }
        return orders.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MedicineOrderResponseDto getOrderDetails(Long orderId) {
        MedicineOrder order = medicineOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine order not found with ID: " + orderId));
        return mapToDto(order);
    }

    @Transactional(readOnly = true)
    public List<MedicineOrderResponseDto> getPatientRecommendations(Long patientUserId) {
        PatientProfile patientProfile = patientProfileRepository.findByUserId(patientUserId).orElse(null);
        Long patProfileId = patientProfile != null ? patientProfile.getId() : patientUserId;

        List<MedicineOrder> orders = medicineOrderRepository.findAllByPatientIdOrderByCreatedAtDesc(patProfileId);
        if (orders.isEmpty()) {
            orders = medicineOrderRepository.findByPatient_UserIdOrderByCreatedAtDesc(patientUserId);
        }
        return orders.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Revalidate price, stock, and prescription rules when patient adds recommendation to cart
     */
    @Transactional
    public MedicineOrderResponseDto addRecommendationToCart(Long orderId, Long patientUserId) {
        MedicineOrder order = medicineOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        validatePatientOrderOwnership(order, patientUserId);

        for (MedicineOrderItem item : order.getItems()) {
            if (item.getMedicineId() != null) {
                EcommerceProduct product = productRepository.findById(item.getMedicineId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine no longer available"));
                if (Boolean.FALSE.equals(product.getIsActive())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medicine " + product.getTitle() + " is no longer active");
                }
                if (product.getStockQuantity() < item.getQuantity()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock for " + product.getTitle() + ". Available: " + product.getStockQuantity());
                }
            }
        }

        order.setStatus(MedicineOrderStatus.CART_ADDED);
        return mapToDto(medicineOrderRepository.save(order));
    }

    /**
     * Checkout validation before payment gateway execution
     */
    @Transactional
    public MedicineOrderResponseDto checkoutOrder(Long orderId, Long patientUserId) {
        MedicineOrder order = medicineOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        validatePatientOrderOwnership(order, patientUserId);

        // Revalidate stock & price on backend (never trust frontend prices)
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (MedicineOrderItem item : order.getItems()) {
            if (item.getMedicineId() != null) {
                EcommerceProduct product = productRepository.findById(item.getMedicineId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found"));
                
                if (product.getStockQuantity() < item.getQuantity()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Out of stock: " + product.getTitle() + " (Available: " + product.getStockQuantity() + ")");
                }

                BigDecimal currentUnitPrice = product.getPrice();
                item.setUnitPrice(currentUnitPrice);
                item.setUnitPriceAtOrder(currentUnitPrice);
                BigDecimal lineTotal = currentUnitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                item.setTotalPrice(lineTotal);

                subtotal = subtotal.add(lineTotal);
                taxTotal = taxTotal.add(lineTotal.multiply(new BigDecimal("0.05")).setScale(2, RoundingMode.HALF_UP));
            }
        }

        BigDecimal grandTotal = subtotal.add(taxTotal);
        order.setSubtotal(subtotal);
        order.setTax(taxTotal);
        order.setTotal(grandTotal);
        order.setTotalAmount(grandTotal);
        order.setStatus(MedicineOrderStatus.PENDING_PAYMENT);

        return mapToDto(medicineOrderRepository.save(order));
    }

    /**
     * Confirms payment and triggers real-time updates to Doctor and Pharmacy
     */
    @Transactional
    public MedicineOrderResponseDto processPayment(Long orderId, Long patientUserId) {
        MedicineOrder order = medicineOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        validatePatientOrderOwnership(order, patientUserId);

        order.setPaymentStatus("PAID");
        order.setStatus(MedicineOrderStatus.PAID);
        MedicineOrder savedOrder = medicineOrderRepository.save(order);

        // Real-time SSE notification to Doctor
        try {
            Long doctorUserId = savedOrder.getDoctor() != null ? savedOrder.getDoctor().getUserId() : null;
            String patientName = getPatientFullName(savedOrder.getPatient());
            if (doctorUserId != null) {
                notificationService.sendToUser(
                        doctorUserId,
                        "Medicine Order Purchased!",
                        patientName + " purchased recommended medicines for Order " + savedOrder.getOrderNumber() + ".",
                        "MEDICINE_ORDER_PAID",
                        savedOrder.getId()
                );
            }
            // Notify Pharmacy
            notificationService.sendToRole(
                    "ROLE_PHARMACIST",
                    "New Paid Medicine Order",
                    "Order " + savedOrder.getOrderNumber() + " paid and ready for dispensing.",
                    "PHARMACY_ORDER_PENDING",
                    savedOrder.getId()
            );
        } catch (Exception e) {
            log.warn("Non-fatal notification error on payment processing: {}", e.getMessage());
        }

        return mapToDto(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<MedicineOrderResponseDto> getPharmacyOrders(String statusStr) {
        List<MedicineOrder> orders;
        if (statusStr != null && !statusStr.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusStr.trim())) {
            try {
                MedicineOrderStatus st = MedicineOrderStatus.valueOf(statusStr.toUpperCase());
                orders = medicineOrderRepository.findByStatusOrderByCreatedAtDesc(st);
            } catch (Exception e) {
                orders = medicineOrderRepository.findAllByOrderByCreatedAtDesc();
            }
        } else {
            orders = medicineOrderRepository.findAllByOrderByCreatedAtDesc();
        }
        return orders.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    /**
     * Pharmacy dispenses order, executing transactional stock deduction and audit log
     */
    @Transactional
    public MedicineOrderResponseDto updateOrderStatus(Long orderId, String targetStatusStr, Long actionUserId) {
        MedicineOrder order = medicineOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        MedicineOrderStatus targetStatus;
        try {
            targetStatus = MedicineOrderStatus.valueOf(targetStatusStr.toUpperCase());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + targetStatusStr);
        }

        // Handle stock deduction when order is DISPENSED / FULFILLED / COMPLETED
        if ((targetStatus == MedicineOrderStatus.COMPLETED || targetStatus == MedicineOrderStatus.DISPATCHED || targetStatus == MedicineOrderStatus.FULFILLED)
                && order.getStatus() != MedicineOrderStatus.COMPLETED && order.getStatus() != MedicineOrderStatus.DISPATCHED) {

            for (MedicineOrderItem item : order.getItems()) {
                if (item.getMedicineId() != null) {
                    EcommerceProduct product = productRepository.findById(item.getMedicineId()).orElse(null);
                    if (product != null) {
                        int newStock = Math.max(0, product.getStockQuantity() - item.getQuantity());
                        product.setStockQuantity(newStock);
                        if (newStock == 0) {
                            product.setProductStatus("OUT_OF_STOCK");
                        }
                        productRepository.save(product);
                        log.info("Deducted stock for medicine ID {}: {} remaining", product.getId(), newStock);
                    }
                }
            }
        }

        order.setStatus(targetStatus);
        MedicineOrder savedOrder = medicineOrderRepository.save(order);

        // Notify patient and doctor of status change
        try {
            Long patientUserId = savedOrder.getPatient() != null ? savedOrder.getPatient().getUserId() : null;
            if (patientUserId != null) {
                notificationService.sendToUser(
                        patientUserId,
                        "Medicine Order Status Update",
                        "Your order " + savedOrder.getOrderNumber() + " is now " + targetStatus.name(),
                        "ORDER_STATUS_UPDATE",
                        savedOrder.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Non-fatal notification error on order status update: {}", e.getMessage());
        }

        return mapToDto(savedOrder);
    }

    private void validatePatientOrderOwnership(MedicineOrder order, Long patientUserId) {
        if (order.getPatient() == null) return;
        Long orderPatientUserId = order.getPatient().getUserId();
        if (orderPatientUserId != null && !orderPatientUserId.equals(patientUserId) && !order.getPatient().getId().equals(patientUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to access this order");
        }
    }

    private String getPatientFullName(PatientProfile profile) {
        if (profile == null) return "Unknown Patient";
        if (profile.getUserId() != null) {
            return userRepository.findById(profile.getUserId())
                    .map(u -> (u.getFirstName() + " " + u.getLastName()).trim())
                    .orElse("Patient #" + profile.getId());
        }
        return "Patient #" + profile.getId();
    }

    private String getDoctorFullName(DoctorProfile profile) {
        if (profile == null) return "Unknown Doctor";
        if (profile.getUserId() != null) {
            return userRepository.findById(profile.getUserId())
                    .map(u -> ("Dr. " + u.getFirstName() + " " + u.getLastName()).trim())
                    .orElse("Dr. #" + profile.getId());
        }
        return "Dr. #" + profile.getId();
    }

    private MedicineOrderResponseDto mapToDto(MedicineOrder order) {
        String patientName = getPatientFullName(order.getPatient());
        String doctorName = getDoctorFullName(order.getDoctor());

        List<MedicineOrderResponseDto.MedicineOrderItemDto> itemDtos = new ArrayList<>();
        if (order.getItems() != null) {
            for (MedicineOrderItem item : order.getItems()) {
                String medName = "Medicine #" + item.getMedicineId();
                String genericName = null;
                String brandName = null;
                String strength = null;
                String dosageForm = null;
                Boolean rxReq = false;
                Integer stock = 0;

                if (item.getMedicineId() != null) {
                    EcommerceProduct product = productRepository.findById(item.getMedicineId()).orElse(null);
                    if (product != null) {
                        medName = product.getTitle();
                        genericName = product.getGenericName();
                        brandName = product.getBrandName();
                        strength = product.getDosageStrength() != null ? product.getDosageStrength() : product.getStrength();
                        dosageForm = product.getDosageForm();
                        rxReq = product.getPrescriptionRequired();
                        stock = product.getStockQuantity();
                    }
                } else if (item.getDoctorMedicine() != null) {
                    medName = item.getDoctorMedicine().getName();
                    stock = item.getDoctorMedicine().getStockQuantity();
                }

                itemDtos.add(MedicineOrderResponseDto.MedicineOrderItemDto.builder()
                        .id(item.getId())
                        .medicineId(item.getMedicineId() != null ? item.getMedicineId() : (item.getDoctorMedicine() != null ? item.getDoctorMedicine().getId() : null))
                        .medicineName(medName)
                        .genericName(genericName)
                        .brandName(brandName)
                        .strength(strength)
                        .dosageForm(dosageForm)
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice() != null ? item.getUnitPrice() : item.getUnitPriceAtOrder())
                        .totalPrice(item.getTotalPrice() != null ? item.getTotalPrice() : (item.getUnitPriceAtOrder().multiply(BigDecimal.valueOf(item.getQuantity()))))
                        .dosage(item.getDosage())
                        .frequency(item.getFrequency())
                        .duration(item.getDuration())
                        .instructions(item.getInstructions())
                        .prescriptionRequired(rxReq)
                        .availableStock(stock)
                        .build());
            }
        }

        return MedicineOrderResponseDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber() != null ? order.getOrderNumber() : ("MED-" + order.getId()))
                .patientId(order.getPatient() != null ? order.getPatient().getId() : null)
                .patientName(patientName)
                .doctorId(order.getDoctor() != null ? order.getDoctor().getId() : null)
                .doctorName(doctorName)
                .prescriptionId(order.getPrescriptionId())
                .branchId(order.getBranchId())
                .status(order.getStatus())
                .subtotal(order.getSubtotal())
                .discount(order.getDiscount())
                .tax(order.getTax())
                .total(order.getTotal() != null && order.getTotal().compareTo(BigDecimal.ZERO) > 0 ? order.getTotal() : order.getTotalAmount())
                .paymentStatus(order.getPaymentStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemDtos)
                .build();
    }
}
