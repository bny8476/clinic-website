package com.healthcare.clinic.ecommerce.service;

import com.healthcare.clinic.ecommerce.entity.EcommerceOrder;
import com.healthcare.clinic.ecommerce.repository.EcommerceOrderRepository;
import com.healthcare.clinic.notification.service.InAppNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class DoctorOrderService {

    private final EcommerceOrderRepository orderRepository;
    private final InAppNotificationService notificationService;

    private static final Set<String> VALID_STATUSES = Set.of(
            "PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REJECTED"
    );

    @Transactional(readOnly = true)
    public List<EcommerceOrder> getDoctorOrders(Long doctorUserId, String status) {
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            List<EcommerceOrder> doctorOrders = orderRepository.findByDoctorIdAndStatusOrderByCreatedAtDesc(doctorUserId, status.toUpperCase());
            if (doctorOrders.isEmpty()) {
                return orderRepository.findByStatus(status.toUpperCase());
            }
            return doctorOrders;
        }
        List<EcommerceOrder> doctorOrders = orderRepository.findByDoctorIdOrderByCreatedAtDesc(doctorUserId);
        if (doctorOrders.isEmpty()) {
            return orderRepository.findAllByOrderByCreatedAtDesc();
        }
        return doctorOrders;
    }

    @Transactional(readOnly = true)
    public EcommerceOrder getOrderDetails(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));
    }

    @Transactional
    public EcommerceOrder updateOrderStatus(Long orderId, String newStatus, String note, Long updatedByUserId) {
        String statusUpper = newStatus != null ? newStatus.toUpperCase().trim() : "";
        if (!VALID_STATUSES.contains(statusUpper)) {
            throw new IllegalArgumentException("Invalid order status: " + newStatus);
        }

        EcommerceOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        log.info("Updating Order {} status from {} to {}", order.getOrderNumber(), order.getStatus(), statusUpper);
        order.setStatus(statusUpper);
        if (note != null && !note.isBlank()) {
            order.setNotes(note);
        }

        EcommerceOrder saved = orderRepository.save(order);

        // 🔔 Send Real-Time SSE Notification to Patient
        String statusFormatted = statusUpper.toLowerCase().replace("_", " ");
        notificationService.sendToUser(
                order.getUserId(),
                "Order Status Update",
                String.format("Your medicine order %s has been %s.", order.getOrderNumber(), statusFormatted),
                "ORDER_STATUS",
                "ORDER",
                order.getId()
        );

        return saved;
    }
}
