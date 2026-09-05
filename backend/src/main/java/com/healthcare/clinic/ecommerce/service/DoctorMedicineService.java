package com.healthcare.clinic.ecommerce.service;

import com.healthcare.clinic.ecommerce.dto.MedicineMasterDto;
import com.healthcare.clinic.ecommerce.entity.EcommerceProduct;
import com.healthcare.clinic.ecommerce.repository.EcommerceProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class DoctorMedicineService {

    private final EcommerceProductRepository productRepository;

    @Transactional
    public MedicineMasterDto createMedicine(MedicineMasterDto dto, Long doctorUserId) {
        log.info("Doctor {} creating new medicine: {}", doctorUserId, dto.getMedicineName());

        BigDecimal effectivePrice = dto.getDiscountPrice() != null && dto.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                ? dto.getDiscountPrice()
                : dto.getPrice();

        EcommerceProduct product = EcommerceProduct.builder()
                .title(dto.getMedicineName())
                .genericName(dto.getGenericName())
                .brandName(dto.getBrandName())
                .manufacturer(dto.getManufacturer())
                .category(dto.getCategory() != null ? dto.getCategory() : "Pain Relief")
                .composition(dto.getComposition())
                .dosageForm(dto.getDosageForm())
                .strength(dto.getStrength())
                .packSize(dto.getPackSize())
                .unit(dto.getUnit())
                .description(dto.getDescription())
                .detailedDescription(dto.getDetailedDescription())
                .indications(dto.getIndications())
                .usageInstructions(dto.getUsageInstructions())
                .warnings(dto.getWarnings())
                .precautions(dto.getPrecautions())
                .sideEffects(dto.getSideEffects())
                .storageInstructions(dto.getStorageInstructions())
                .prescriptionRequired(Boolean.TRUE.equals(dto.getPrescriptionRequired()))
                .price(effectivePrice)
                .mrp(dto.getPrice())
                .discountPrice(dto.getDiscountPrice())
                .taxPercentage(dto.getTaxPercentage() != null ? dto.getTaxPercentage() : BigDecimal.ZERO)
                .stockQuantity(dto.getStockQuantity())
                .minimumStockLevel(dto.getMinimumStockLevel() != null ? dto.getMinimumStockLevel() : 10)
                .imageUrl(dto.getMedicineImage())
                .medicineImage(dto.getMedicineImage())
                .isActive("ACTIVE".equalsIgnoreCase(dto.getStatus()))
                .productStatus("ACTIVE".equalsIgnoreCase(dto.getStatus()) ? "ACTIVE" : "DRAFT")
                .doctorId(doctorUserId)
                .createdBy(doctorUserId)
                .build();

        EcommerceProduct saved = productRepository.save(product);
        return mapToDto(saved);
    }

    @Transactional
    public MedicineMasterDto updateMedicine(Long id, MedicineMasterDto dto, Long doctorUserId) {
        EcommerceProduct product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + id));

        log.info("Updating medicine ID {}: {}", id, dto.getMedicineName());

        BigDecimal effectivePrice = dto.getDiscountPrice() != null && dto.getDiscountPrice().compareTo(BigDecimal.ZERO) > 0
                ? dto.getDiscountPrice()
                : dto.getPrice();

        product.setTitle(dto.getMedicineName());
        product.setGenericName(dto.getGenericName());
        product.setBrandName(dto.getBrandName());
        product.setManufacturer(dto.getManufacturer());
        if (dto.getCategory() != null) product.setCategory(dto.getCategory());
        product.setComposition(dto.getComposition());
        product.setDosageForm(dto.getDosageForm());
        product.setStrength(dto.getStrength());
        product.setPackSize(dto.getPackSize());
        product.setUnit(dto.getUnit());
        product.setDescription(dto.getDescription());
        product.setDetailedDescription(dto.getDetailedDescription());
        product.setIndications(dto.getIndications());
        product.setUsageInstructions(dto.getUsageInstructions());
        product.setWarnings(dto.getWarnings());
        product.setPrecautions(dto.getPrecautions());
        product.setSideEffects(dto.getSideEffects());
        product.setStorageInstructions(dto.getStorageInstructions());
        product.setPrescriptionRequired(Boolean.TRUE.equals(dto.getPrescriptionRequired()));
        product.setPrice(effectivePrice);
        product.setMrp(dto.getPrice());
        product.setDiscountPrice(dto.getDiscountPrice());
        if (dto.getTaxPercentage() != null) product.setTaxPercentage(dto.getTaxPercentage());
        product.setStockQuantity(dto.getStockQuantity());
        if (dto.getMinimumStockLevel() != null) product.setMinimumStockLevel(dto.getMinimumStockLevel());
        if (dto.getMedicineImage() != null) {
            product.setImageUrl(dto.getMedicineImage());
            product.setMedicineImage(dto.getMedicineImage());
        }
        if (dto.getStatus() != null) {
            boolean active = "ACTIVE".equalsIgnoreCase(dto.getStatus());
            product.setIsActive(active);
            product.setProductStatus(active ? "ACTIVE" : "DRAFT");
        }
        product.setUpdatedBy(doctorUserId);

        EcommerceProduct updated = productRepository.save(product);
        return mapToDto(updated);
    }

    @Transactional(readOnly = true)
    public List<MedicineMasterDto> getMedicinesByDoctor(Long doctorUserId) {
        return productRepository.findByDoctorId(doctorUserId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MedicineMasterDto> getAllMedicines() {
        return productRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deactivateMedicine(Long id, Long doctorUserId) {
        EcommerceProduct product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found with ID: " + id));
        product.setIsActive(false);
        product.setProductStatus("DRAFT");
        product.setUpdatedBy(doctorUserId);
        productRepository.save(product);
    }

    public MedicineMasterDto mapToDto(EcommerceProduct p) {
        return MedicineMasterDto.builder()
                .id(p.getId())
                .medicineName(p.getTitle())
                .genericName(p.getGenericName())
                .brandName(p.getBrandName())
                .manufacturer(p.getManufacturer())
                .category(p.getCategory())
                .composition(p.getComposition())
                .dosageForm(p.getDosageForm())
                .strength(p.getDosageStrength() != null ? p.getDosageStrength() : p.getStrength())
                .packSize(p.getPackSize())
                .unit(p.getUnit())
                .description(p.getDescription())
                .detailedDescription(p.getDetailedDescription())
                .indications(p.getIndications())
                .usageInstructions(p.getUsageInstructions())
                .warnings(p.getWarnings())
                .precautions(p.getPrecautions())
                .sideEffects(p.getSideEffects())
                .storageInstructions(p.getStorageInstructions())
                .prescriptionRequired(p.getPrescriptionRequired())
                .price(p.getMrp() != null ? p.getMrp() : p.getPrice())
                .discountPrice(p.getDiscountPrice() != null ? p.getDiscountPrice() : p.getPrice())
                .taxPercentage(p.getTaxPercentage())
                .stockQuantity(p.getStockQuantity())
                .minimumStockLevel(p.getMinimumStockLevel())
                .medicineImage(p.getMedicineImage() != null ? p.getMedicineImage() : p.getImageUrl())
                .status(Boolean.TRUE.equals(p.getIsActive()) ? "ACTIVE" : "INACTIVE")
                .doctorId(p.getDoctorId())
                .createdBy(p.getCreatedBy())
                .createdAt(p.getCreatedAt())
                .updatedBy(p.getUpdatedBy())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
