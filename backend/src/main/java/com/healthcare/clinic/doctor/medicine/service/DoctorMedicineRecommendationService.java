package com.healthcare.clinic.doctor.medicine.service;

import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.doctor.medicine.dto.DoctorRecommendationRequestDto;
import com.healthcare.clinic.doctor.medicine.dto.DoctorRecommendationResponseDto;
import com.healthcare.clinic.doctor.medicine.entity.DoctorMedicineRecommendation;
import com.healthcare.clinic.doctor.medicine.entity.DoctorMedicineRecommendation.RecommendationStatus;
import com.healthcare.clinic.doctor.medicine.repository.DoctorMedicineRecommendationRepository;
import com.healthcare.clinic.ecommerce.entity.EcCart;
import com.healthcare.clinic.ecommerce.entity.EcommerceProduct;
import com.healthcare.clinic.ecommerce.repository.EcommerceProductRepository;
import com.healthcare.clinic.ecommerce.service.CartService;
import com.healthcare.clinic.exception.ResourceNotFoundException;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.notification.service.InAppNotificationService;
import com.healthcare.clinic.patient.entity.PatientProfile;
import com.healthcare.clinic.patient.repository.PatientProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class DoctorMedicineRecommendationService {

    private final DoctorMedicineRecommendationRepository recommendationRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final EcommerceProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartService cartService;
    private final InAppNotificationService notificationService;

    @Transactional
    public List<DoctorRecommendationResponseDto> createRecommendations(Long doctorUserId, DoctorRecommendationRequestDto request) {
        DoctorProfile doctorProfile = doctorProfileRepository.findByUserId(doctorUserId)
                .orElseGet(() -> doctorProfileRepository.findById(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for ID: " + doctorUserId)));

        PatientProfile patientProfile = patientProfileRepository.findById(request.getPatientId())
                .orElseGet(() -> patientProfileRepository.findByUserId(request.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for ID: " + request.getPatientId())));

        List<DoctorMedicineRecommendation> savedList = new ArrayList<>();

        for (DoctorRecommendationRequestDto.Item itemDto : request.getItems()) {
            EcommerceProduct product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine product not found with ID: " + itemDto.getProductId()));

            if (Boolean.FALSE.equals(product.getIsActive())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medicine '" + product.getTitle() + "' is currently inactive");
            }

            DoctorMedicineRecommendation recommendation = DoctorMedicineRecommendation.builder()
                    .patient(patientProfile)
                    .doctor(doctorProfile)
                    .consultationId(request.getConsultationId())
                    .prescriptionId(request.getPrescriptionId())
                    .product(product)
                    .quantity(itemDto.getQuantity())
                    .dosage(itemDto.getDosage())
                    .frequency(itemDto.getFrequency())
                    .duration(itemDto.getDuration())
                    .route(itemDto.getRoute())
                    .instructions(itemDto.getInstructions())
                    .doctorNotes(itemDto.getDoctorNotes())
                    .status(RecommendationStatus.RECOMMENDED)
                    .branchId(request.getBranchId() != null ? request.getBranchId() : doctorProfile.getBranchId())
                    .build();

            savedList.add(recommendationRepository.save(recommendation));
        }

        // Real-time SSE notification to Patient
        try {
            Long patientUserId = patientProfile.getUserId();
            if (patientUserId != null) {
                User doctorUser = userRepository.findById(doctorUserId).orElse(null);
                String doctorName = doctorUser != null ? "Dr. " + doctorUser.getFirstName() + " " + doctorUser.getLastName() : "Your Doctor";
                String firstMedName = savedList.get(0).getProduct().getTitle();

                notificationService.sendToUser(
                        patientUserId,
                        "🩺 New Doctor Medicine Recommendation",
                        String.format("%s recommended %s (%d item/s) for your treatment plan.", doctorName, firstMedName, savedList.size()),
                        "MEDICINE_RECOMMENDATION",
                        "RECOMMENDATION",
                        savedList.get(0).getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to send real-time recommendation notification to patient: {}", e.getMessage());
        }

        return savedList.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DoctorRecommendationResponseDto> getPatientRecommendations(Long authenticatedPatientUserId) {
        List<RecommendationStatus> activeStatuses = List.of(
                RecommendationStatus.RECOMMENDED,
                RecommendationStatus.PATIENT_VIEWED,
                RecommendationStatus.ADDED_TO_CART
        );
        List<DoctorMedicineRecommendation> recs = recommendationRepository.findByPatientUserIdAndStatusIn(authenticatedPatientUserId, activeStatuses);
        return recs.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DoctorRecommendationResponseDto> getDoctorPatientRecommendations(Long doctorUserId, Long patientId) {
        PatientProfile patientProfile = patientProfileRepository.findById(patientId)
                .orElseGet(() -> patientProfileRepository.findByUserId(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for ID: " + patientId)));

        List<DoctorMedicineRecommendation> recs = recommendationRepository.findByPatientIdOrderByCreatedAtDesc(patientProfile.getId());
        return recs.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public DoctorRecommendationResponseDto addRecommendationToCart(Long recommendationId, Long patientUserId) {
        DoctorMedicineRecommendation recommendation = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation not found for ID: " + recommendationId));

        // Strict Ownership Security Check
        if (recommendation.getPatient() == null || recommendation.getPatient().getUserId() == null ||
                !recommendation.getPatient().getUserId().equals(patientUserId)) {
            throw new AccessDeniedException("You are not authorized to access this recommendation.");
        }

        if (recommendation.getStatus() == RecommendationStatus.ORDERED || recommendation.getStatus() == RecommendationStatus.EXPIRED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recommendation is no longer active for cart addition.");
        }

        EcommerceProduct product = recommendation.getProduct();
        if (Boolean.FALSE.equals(product.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Medicine '" + product.getTitle() + "' is inactive.");
        }

        if (product.getStockQuantity() < recommendation.getQuantity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock for medicine '" + product.getTitle() + "'. Available: " + product.getStockQuantity());
        }

        // Add to canonical cart
        EcCart cart = cartService.getOrCreateCart(patientUserId, null);
        cartService.addItemToCart(cart.getId(), product.getId(), recommendation.getQuantity());

        recommendation.setStatus(RecommendationStatus.ADDED_TO_CART);
        DoctorMedicineRecommendation updated = recommendationRepository.save(recommendation);

        return mapToDto(updated);
    }

    public DoctorRecommendationResponseDto mapToDto(DoctorMedicineRecommendation rec) {
        String patientName = "Patient #" + (rec.getPatient() != null ? rec.getPatient().getId() : "");
        if (rec.getPatient() != null && rec.getPatient().getUserId() != null) {
            User pUser = userRepository.findById(rec.getPatient().getUserId()).orElse(null);
            if (pUser != null) {
                patientName = pUser.getFirstName() + " " + pUser.getLastName();
            }
        }

        String doctorName = "Doctor #" + (rec.getDoctor() != null ? rec.getDoctor().getId() : "");
        if (rec.getDoctor() != null && rec.getDoctor().getUserId() != null) {
            User dUser = userRepository.findById(rec.getDoctor().getUserId()).orElse(null);
            if (dUser != null) {
                doctorName = "Dr. " + dUser.getFirstName() + " " + dUser.getLastName();
            }
        }

        EcommerceProduct p = rec.getProduct();

        return DoctorRecommendationResponseDto.builder()
                .id(rec.getId())
                .patientId(rec.getPatient() != null ? rec.getPatient().getId() : null)
                .patientName(patientName)
                .doctorId(rec.getDoctor() != null ? rec.getDoctor().getId() : null)
                .doctorName(doctorName)
                .consultationId(rec.getConsultationId())
                .prescriptionId(rec.getPrescriptionId())
                .productId(p != null ? p.getId() : null)
                .productName(p != null ? p.getTitle() : null)
                .brandName(p != null ? (p.getBrandName() != null ? p.getBrandName() : p.getManufacturer()) : null)
                .genericName(p != null ? p.getGenericName() : null)
                .strength(p != null ? p.getStrength() : null)
                .dosageForm(p != null ? p.getDosageForm() : null)
                .price(p != null ? p.getPrice() : null)
                .stockQuantity(p != null ? p.getStockQuantity() : 0)
                .prescriptionRequired(p != null && Boolean.TRUE.equals(p.getPrescriptionRequired()))
                .quantity(rec.getQuantity())
                .dosage(rec.getDosage())
                .frequency(rec.getFrequency())
                .duration(rec.getDuration())
                .route(rec.getRoute())
                .instructions(rec.getInstructions())
                .doctorNotes(rec.getDoctorNotes())
                .status(rec.getStatus() != null ? rec.getStatus().name() : null)
                .branchId(rec.getBranchId())
                .createdAt(rec.getCreatedAt())
                .updatedAt(rec.getUpdatedAt())
                .build();
    }
}
