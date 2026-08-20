package com.healthcare.clinic.doctor.job;

import com.healthcare.clinic.billing.dto.InvoiceRequest;
import com.healthcare.clinic.billing.dto.InvoiceItemRequest;
import com.healthcare.clinic.billing.service.BillingService;
import com.healthcare.clinic.doctor.entity.BillingOutbox;
import com.healthcare.clinic.doctor.service.ClinicalBillingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BillingOutboxProcessorJob {

    private final ClinicalBillingService clinicalBillingService;
    private final BillingService billingService;

    @Scheduled(cron = "0 0/5 * * * *") // Every 5 minutes
    public void processPendingBillingEvents() {
        List<BillingOutbox> pendingEvents = clinicalBillingService.getPendingBillingEvents();
        
        for (BillingOutbox event : pendingEvents) {
            try {
                // Determine fee dynamically if not set
                BigDecimal amount = event.getAmount();
                if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                    amount = getDynamicFeeForServiceCode(event.getServiceCode());
                }

                InvoiceRequest request = new InvoiceRequest();
                request.setPatientId(event.getPatientId());
                request.setDescription("Billing for " + event.getServiceType());
                request.setDueDate(java.time.LocalDateTime.now().plusDays(14));
                
                InvoiceItemRequest item = new InvoiceItemRequest();
                item.setDescription(event.getServiceType() + " (" + event.getServiceCode() + ")");
                item.setQuantity(1);
                item.setUnitPrice(amount);
                item.setItemType(com.healthcare.clinic.billing.entity.ItemType.CONSULTATION);
                
                request.setItems(List.of(item));

                billingService.createInvoice(request);

                clinicalBillingService.markAsProcessed(event.getId());
                log.info("Successfully processed billing outbox event {}", event.getId());
            } catch (Exception e) {
                log.error("Failed to process billing outbox event {}", event.getId(), e);
                clinicalBillingService.markAsFailed(event.getId(), e.getMessage());
            }
        }
    }

    private BigDecimal getDynamicFeeForServiceCode(String serviceCode) {
        if (serviceCode == null) return new BigDecimal("150.00");
        return switch (serviceCode) {
            case "CONS-01" -> new BigDecimal("150.00");
            case "CONS-02" -> new BigDecimal("250.00"); // Specialist
            case "PROC-01" -> new BigDecimal("500.00"); // Minor Procedure
            default -> new BigDecimal("100.00");
        };
    }
}
