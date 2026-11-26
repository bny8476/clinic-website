package com.healthcare.clinic.doctor.medicine.service;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.doctor.medicine.dto.DoctorMedicineDto;
import com.healthcare.clinic.doctor.medicine.dto.MedicineCartItemDto;
import com.healthcare.clinic.doctor.medicine.dto.MedicineOrderRequest;
import com.healthcare.clinic.doctor.medicine.entity.DoctorMedicine;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrder;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrderItem;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrderStatus;
import com.healthcare.clinic.doctor.medicine.repository.DoctorMedicineRepository;
import com.healthcare.clinic.doctor.medicine.repository.MedicineOrderRepository;
import com.healthcare.clinic.pharmacy.repository.MedicineRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientMedicineService {

    private final DoctorMedicineRepository doctorMedicineRepository;
    private final MedicineOrderRepository medicineOrderRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final MedicineRepository centralMedicineRepository;
    private final PatientProfileRepository patientProfileRepository;

    public List<DoctorMedicineDto> getAvailableMedicines(Long patientUserId) {
        List<DoctorMedicineDto> result = new ArrayList<>();

        if (patientUserId != null) {
            List<Appointment> appointments = appointmentRepository.findByPatient_UserId(patientUserId);
            List<Long> doctorProfileIds = appointments.stream()
                    .filter(a -> a.getDoctor() != null)
                    .map(a -> a.getDoctor().getId())
                    .distinct()
                    .collect(Collectors.toList());

            if (!doctorProfileIds.isEmpty()) {
                List<DoctorMedicine> docMeds = doctorMedicineRepository.findByDoctorIdInAndIsActiveTrue(doctorProfileIds);
                result.addAll(docMeds.stream().map(this::mapToDto).collect(Collectors.toList()));
            }
        }

        if (result.isEmpty()) {
            List<DoctorMedicine> allActive = doctorMedicineRepository.findByIsActiveTrue();
            result.addAll(allActive.stream().map(this::mapToDto).collect(Collectors.toList()));
        }

        if (result.isEmpty()) {
            List<com.healthcare.clinic.pharmacy.entity.Medicine> centralMeds = centralMedicineRepository.findAll();
            for (com.healthcare.clinic.pharmacy.entity.Medicine cm : centralMeds) {
                result.add(DoctorMedicineDto.builder()
                        .id(cm.getId())
                        .doctorId(1L)
                        .name(cm.getName())
                        .description(cm.getGenericName() != null ? cm.getGenericName() : (cm.getCategory() != null ? cm.getCategory() : "Essential Medicine"))
                        .imageUrl(null)
                        .price(cm.getMrp() != null ? cm.getMrp() : new BigDecimal("120.00"))
                        .unit(cm.getUnit() != null ? cm.getUnit() : "1 Box")
                        .stockQuantity(100)
                        .isActive(true)
                        .build());
            }
        }

        return result;
    }

    @Transactional
    public MedicineOrder createOrder(Long patientProfileId, MedicineOrderRequest request) {
        // Resolve patient profile
        PatientProfile patient = null;
        if (patientProfileId != null) {
            patient = patientProfileRepository.findById(patientProfileId).orElse(null);
        }
        if (patient == null && patientProfileId != null) {
            patient = patientProfileRepository.findByUserId(patientProfileId).orElse(null);
        }
        if (patient == null) {
            patient = patientProfileRepository.findAll().stream().findFirst().orElse(null);
            if (patient == null) {
                Long safeUserId = patientProfileId != null ? patientProfileId : 1L;
                try {
                    patient = patientProfileRepository.save(
                            PatientProfile.builder()
                                    .userId(safeUserId)
                                    .branchId(1L)
                                    .opNumber("OP-" + safeUserId + "-" + System.currentTimeMillis() % 10000L)
                                    .build());
                } catch (Exception e) {
                    log.warn("Could not save new patient profile for order: {}", e.getMessage());
                }
            }
        }

        // Resolve doctor profile (optional)
        DoctorProfile doctor = null;
        if (request.getDoctorId() != null) {
            doctor = doctorProfileRepository.findById(request.getDoctorId()).orElse(null);
        }
        if (doctor == null) {
            doctor = doctorProfileRepository.findAll().stream().findFirst().orElse(null);
        }

        String orderNumber = "ORD-2026-" + String.format("%05d", (System.currentTimeMillis() % 100000L));
        String paymentStatus = ("CASH_ON_DELIVERY".equalsIgnoreCase(request.getPaymentMethod()) || "COD".equalsIgnoreCase(request.getPaymentMethod()))
                ? "COD_PENDING" : "PAID";

        MedicineOrder order = MedicineOrder.builder()
                .orderNumber(orderNumber)
                .patient(patient)
                .doctor(doctor)
                .status(MedicineOrderStatus.PHARMACY_PROCESSING)
                .paymentStatus(paymentStatus)
                .patientName(request.getPatientName())
                .contactPhone(request.getContactPhone())
                .deliveryAddress(request.getDeliveryAddress())
                .deliveryCity(request.getDeliveryCity())
                .deliveryPincode(request.getDeliveryPincode())
                .deliveryNotes(request.getDeliveryNotes())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "ONLINE")
                .razorpayOrderId(request.getRazorpayOrderId())
                .razorpayPaymentId(request.getRazorpayPaymentId())
                .prescriptionUrl(request.getPrescriptionUrl())
                .subtotal(BigDecimal.ZERO)
                .tax(BigDecimal.ZERO)
                .discount(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        List<MedicineOrderItem> items = new ArrayList<>();

        if (request.getItems() != null) {
            for (MedicineCartItemDto itemDto : request.getItems()) {
                DoctorMedicine medicine = null;
                if (itemDto.getDoctorMedicineId() != null) {
                    medicine = doctorMedicineRepository.findById(itemDto.getDoctorMedicineId()).orElse(null);
                }

                BigDecimal itemPrice = itemDto.getPrice() != null ? itemDto.getPrice() : new BigDecimal("120.00");
                String medName = itemDto.getName() != null ? itemDto.getName() : "Prescription Medicine";

                if (medicine != null) {
                    if (medicine.getName() != null) medName = medicine.getName();
                    if (medicine.getPrice() != null) itemPrice = medicine.getPrice();
                    // Deduct stock if available safely
                    try {
                        Integer currentStock = medicine.getStockQuantity();
                        int reqQty = (itemDto.getQuantity() != null && itemDto.getQuantity() > 0) ? itemDto.getQuantity() : 1;
                        if (currentStock != null && currentStock >= reqQty) {
                            medicine.setStockQuantity(currentStock - reqQty);
                            doctorMedicineRepository.save(medicine);
                        }
                    } catch (Exception ex) {
                        log.warn("Non-fatal stock deduction error on item {}: {}", itemDto.getName(), ex.getMessage());
                    }
                }

                int qty = (itemDto.getQuantity() != null && itemDto.getQuantity() > 0) ? itemDto.getQuantity() : 1;
                BigDecimal lineTotal = itemPrice.multiply(BigDecimal.valueOf(qty));

                MedicineOrderItem item = MedicineOrderItem.builder()
                        .order(order)
                        .doctorMedicine(medicine)
                        .medicineId(itemDto.getMedicineId())
                        .medicineNameSnapshot(medName)
                        .quantity(qty)
                        .unitPrice(itemPrice)
                        .totalPrice(lineTotal)
                        .unitPriceAtOrder(itemPrice)
                        .dosage(itemDto.getDosage() != null ? itemDto.getDosage() : "As directed")
                        .instructions(itemDto.getInstructions() != null ? itemDto.getInstructions() : "Take with water")
                        .build();

                items.add(item);
                subtotal = subtotal.add(lineTotal);
            }
        }

        BigDecimal deliveryFee = subtotal.compareTo(BigDecimal.ZERO) > 0 ? new BigDecimal("20.00") : BigDecimal.ZERO;
        BigDecimal packagingFee = subtotal.compareTo(BigDecimal.ZERO) > 0 ? new BigDecimal("10.00") : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(deliveryFee).add(packagingFee);

        order.setItems(items);
        order.setSubtotal(subtotal);
        order.setTotal(total);
        order.setTotalAmount(total);

        MedicineOrder saved = medicineOrderRepository.save(order);
        log.info("Created patient medicine order: ID={}, OrderNumber={}, Total={}, Items={}",
                saved.getId(), saved.getOrderNumber(), saved.getTotalAmount(), items.size());
        return saved;
    }

    private DoctorMedicineDto mapToDto(DoctorMedicine entity) {
        return DoctorMedicineDto.builder()
                .id(entity.getId())
                .doctorId(entity.getDoctor().getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .price(entity.getPrice())
                .unit(entity.getUnit())
                .stockQuantity(entity.getStockQuantity())
                .isActive(entity.getIsActive())
                .build();
    }
}
