package com.healthcare.clinic.pharmacy.service;


import com.healthcare.clinic.pharmacy.entity.PurchaseOrder;
import com.healthcare.clinic.pharmacy.entity.PoLineItem;
import com.healthcare.clinic.pharmacy.repository.PurchaseOrderRepository;
import com.healthcare.clinic.pharmacy.repository.MedicineRepository;
import com.healthcare.clinic.pharmacy.repository.SupplierRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.healthcare.clinic.pharmacy.dto.common.PageResponse;

@Service("pharmacyPurchaseOrderService")
@Transactional
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final MedicineRepository medicineRepository;
    private final SupplierRepository supplierRepository;

    public PurchaseOrderService(PurchaseOrderRepository poRepository,
                                MedicineRepository medicineRepository,
                                SupplierRepository supplierRepository) {
        this.poRepository = poRepository;
        this.medicineRepository = medicineRepository;
        this.supplierRepository = supplierRepository;
    }

    public PurchaseOrder getPoById(String id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found: " + id));
    }

    @Transactional
    public PurchaseOrder createPO(PurchaseOrder po) {
        po.setPoId(UUID.randomUUID().toString());
        po.setPoNumber("PO-" + LocalDate.now().toString().replace("-","") + "-" + (System.currentTimeMillis() % 10000));
        po.setStatus("draft");
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal gstAmount = BigDecimal.ZERO;

        if (po.getLineItems() != null) {
            for (PoLineItem item : po.getLineItems()) {
                item.setLineId(UUID.randomUUID().toString());
                item.setPurchaseOrder(po);
                
                // Recalculate totals from line items to be absolutely certain
                if (item.getLineSubtotal() != null) subtotal = subtotal.add(item.getLineSubtotal());
                if (item.getLineGst() != null) gstAmount = gstAmount.add(item.getLineGst());
            }
        }
        
        po.setSubtotal(subtotal);
        po.setGstAmount(gstAmount);
        po.setTotalValue(subtotal.add(gstAmount));

        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder submitForApproval(String poId) {
        PurchaseOrder po = getPoById(poId);
        po.setStatus("submitted");
        po.setSubmittedAt(LocalDateTime.now());
        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder approvePO(String poId, Long approvedBy) {
        PurchaseOrder po = getPoById(poId);
        po.setStatus("approved");
        po.setApprovedBy(approvedBy);
        po.setApprovedAt(LocalDateTime.now());
        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder sendToSupplier(String poId) {
        PurchaseOrder po = getPoById(poId);
        po.setStatus("sent");
        po.setSentAt(LocalDateTime.now());
        return poRepository.save(po);
    }

    @Transactional
    public PurchaseOrder cancelPO(String poId, String reason, Long user) {
        PurchaseOrder po = getPoById(poId);
        po.setStatus("cancelled");
        po.setCancellationReason(reason);
        po.setCancelledBy(user);
        po.setUpdatedAt(LocalDateTime.now());
        return poRepository.save(po);
    }

    public void deletePO(String poId) {
        PurchaseOrder po = getPoById(poId);
        poRepository.delete(po);
    }

    public Map<String, Object> getPoSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalOpenPOs", poRepository.countByStatus("sent") + poRepository.countByStatus("submitted"));
        summary.put("awaitingApproval", poRepository.countByStatus("submitted"));
        summary.put("sentToSupplier", poRepository.countByStatus("sent"));
        summary.put("overduePOs", poRepository.findOverduePOs(LocalDate.now()).size());
        return summary;
    }

    public PageResponse<PurchaseOrder> getAllPosPaged(Pageable pageable) {
        Page<PurchaseOrder> pageResult = poRepository.findAll(pageable);
        return new PageResponse<>(pageResult);
    }

    public PageResponse<PurchaseOrder> getPOsByStatusPaged(String status, Pageable pageable) {
        Page<PurchaseOrder> pageResult = poRepository.findByStatus(status, pageable);
        return new PageResponse<>(pageResult);
    }

    public PageResponse<PurchaseOrder> searchPOs(String term, Pageable pageable) {
        Page<PurchaseOrder> pageResult = poRepository.findByPoNumberContainingIgnoreCaseOrSupplierNameContainingIgnoreCase(term, term, pageable);
        return new PageResponse<>(pageResult);
    }
}
