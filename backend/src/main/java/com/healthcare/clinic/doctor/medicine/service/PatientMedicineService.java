package com.healthcare.clinic.doctor.medicine.service;

import com.healthcare.clinic.appointment.entity.Appointment;
import com.healthcare.clinic.appointment.repository.AppointmentRepository;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.medicine.dto.DoctorMedicineDto;
import com.healthcare.clinic.doctor.medicine.dto.MedicineCartItemDto;
import com.healthcare.clinic.doctor.medicine.dto.MedicineOrderRequest;
import com.healthcare.clinic.doctor.medicine.entity.DoctorMedicine;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrder;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrderItem;
import com.healthcare.clinic.doctor.medicine.entity.MedicineOrderStatus;
import com.healthcare.clinic.doctor.medicine.repository.DoctorMedicineRepository;
import com.healthcare.clinic.doctor.medicine.repository.MedicineOrderRepository;
import com.healthcare.clinic.patient.entity.PatientProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientMedicineService {

    private final DoctorMedicineRepository doctorMedicineRepository;
    private final MedicineOrderRepository medicineOrderRepository;
    private final AppointmentRepository appointmentRepository;

    public List<DoctorMedicineDto> getAvailableMedicines(Long patientUserId) {
        if (patientUserId == null) {
            return doctorMedicineRepository.findByIsActiveTrue().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }

        List<Appointment> appointments = appointmentRepository.findByPatient_UserId(patientUserId);
        
        List<Long> doctorProfileIds = appointments.stream()
                .filter(a -> a.getDoctor() != null)
                .map(a -> a.getDoctor().getId())
                .distinct()
                .collect(Collectors.toList());

        if (doctorProfileIds.isEmpty()) {
            return doctorMedicineRepository.findByIsActiveTrue().stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }

        return doctorMedicineRepository.findByDoctorIdInAndIsActiveTrue(doctorProfileIds).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Long createOrder(Long patientProfileId, MedicineOrderRequest request) {
        // Validate relationship
        List<Appointment> appointments = appointmentRepository.findByPatientId(patientProfileId);
        boolean hasRelationship = appointments.stream()
                .anyMatch(a -> a.getDoctor().getId().equals(request.getDoctorId()));

        if (!hasRelationship) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot order medicines from this doctor");
        }

        MedicineOrder order = MedicineOrder.builder()
                .patient(PatientProfile.builder().id(patientProfileId).build())
                .doctor(DoctorProfile.builder().id(request.getDoctorId()).build())
                .status(MedicineOrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<MedicineOrderItem> items = new ArrayList<>();

        for (MedicineCartItemDto itemDto : request.getItems()) {
            DoctorMedicine medicine = doctorMedicineRepository.findById(itemDto.getDoctorMedicineId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Medicine not found"));

            if (!medicine.getDoctor().getId().equals(request.getDoctorId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medicine does not belong to the specified doctor");
            }

            if (!medicine.getIsActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medicine is no longer active");
            }

            if (medicine.getStockQuantity() < itemDto.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough stock for " + medicine.getName());
            }

            // Decrement stock
            medicine.setStockQuantity(medicine.getStockQuantity() - itemDto.getQuantity());
            doctorMedicineRepository.save(medicine);

            MedicineOrderItem item = MedicineOrderItem.builder()
                    .order(order)
                    .doctorMedicine(medicine)
                    .quantity(itemDto.getQuantity())
                    .unitPriceAtOrder(medicine.getPrice())
                    .build();

            items.add(item);
            total = total.add(medicine.getPrice().multiply(new BigDecimal(itemDto.getQuantity())));
        }

        order.setItems(items);
        order.setTotalAmount(total);

        MedicineOrder savedOrder = medicineOrderRepository.save(order);
        return savedOrder.getId();
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
