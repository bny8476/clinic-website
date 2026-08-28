package com.healthcare.clinic.doctor.service;

import com.healthcare.clinic.appointment.entity.AppointmentSlot;
import com.healthcare.clinic.appointment.repository.AppointmentSlotRepository;
import com.healthcare.clinic.doctor.dto.DoctorWorkingHoursDto;
import com.healthcare.clinic.doctor.dto.ScheduleOverrideRequest;
import com.healthcare.clinic.doctor.dto.WorkingHoursRequest;
import com.healthcare.clinic.doctor.entity.DoctorProfile;
import com.healthcare.clinic.doctor.entity.DoctorScheduleOverride;
import com.healthcare.clinic.doctor.entity.DoctorWorkingHours;
import com.healthcare.clinic.doctor.repository.DoctorProfileRepository;
import com.healthcare.clinic.doctor.repository.DoctorScheduleOverrideRepository;
import com.healthcare.clinic.doctor.repository.DoctorWorkingHoursRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorScheduleService {

    private final DoctorWorkingHoursRepository workingHoursRepository;
    private final DoctorScheduleOverrideRepository overrideRepository;
    private final DoctorProfileRepository doctorRepository;
    private final AppointmentSlotRepository slotRepository;

    @Transactional(readOnly = true)
    public List<DoctorWorkingHoursDto> getWorkingHours(Long userId) {
        DoctorProfile doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        return workingHoursRepository.findByDoctorIdAndIsActiveTrue(doctor.getId()).stream()
                .map(wh -> DoctorWorkingHoursDto.builder()
                        .id(wh.getId())
                        .doctorId(wh.getDoctor().getId())
                        .dayOfWeek(wh.getDayOfWeek())
                        .startTime(wh.getStartTime())
                        .endTime(wh.getEndTime())
                        .slotDurationMinutes(wh.getSlotDurationMinutes())
                        .isActive(wh.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void setWorkingHours(Long userId, List<WorkingHoursRequest> requests) {
        DoctorProfile doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        Long doctorId = doctor.getId();

        for (WorkingHoursRequest req : requests) {
            Optional<DoctorWorkingHours> existing = workingHoursRepository.findByDoctorIdAndDayOfWeek(doctorId, req.getDayOfWeek());
            DoctorWorkingHours wh = existing.orElse(new DoctorWorkingHours());
            wh.setDoctor(doctor);
            wh.setDayOfWeek(req.getDayOfWeek());
            wh.setStartTime(req.getStartTime());
            wh.setEndTime(req.getEndTime());
            wh.setSlotDurationMinutes(req.getSlotDurationMinutes());
            wh.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
            wh.setBranchId(doctor.getBranchId());

            if (wh.getEndTime().isBefore(wh.getStartTime()) || wh.getEndTime().equals(wh.getStartTime())) {
                throw new RuntimeException("End time must be after start time");
            }
            if (!List.of(10, 15, 20, 30, 45, 60).contains(wh.getSlotDurationMinutes())) {
                throw new RuntimeException("Invalid slot duration");
            }
            workingHoursRepository.save(wh);
        }
    }

    @Transactional
    public void setOverride(Long userId, ScheduleOverrideRequest request) {
        DoctorProfile doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        Long doctorId = doctor.getId();

        Optional<DoctorScheduleOverride> existing = overrideRepository.findByDoctorIdAndOverrideDate(doctorId, request.getOverrideDate());
        DoctorScheduleOverride override = existing.orElse(new DoctorScheduleOverride());
        override.setDoctor(doctor);
        override.setOverrideDate(request.getOverrideDate());
        override.setIsUnavailable(request.getIsUnavailable());
        override.setStartTime(request.getStartTime());
        override.setEndTime(request.getEndTime());
        override.setReason(request.getReason());
        override.setBranchId(doctor.getBranchId());

        if (!override.getIsUnavailable() && (override.getStartTime() == null || override.getEndTime() == null)) {
            throw new RuntimeException("Must provide start and end time if available");
        }

        overrideRepository.save(override);
    }

    @Transactional
    public void deleteOverride(Long userId, LocalDate date) {
        DoctorProfile doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        overrideRepository.deleteByDoctorIdAndOverrideDate(doctor.getId(), date);
    }

    @Transactional
    public int generateSlotsForRange(Long userId, LocalDate from, LocalDate to) {
        DoctorProfile doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        Long doctorId = doctor.getId();
        
        List<DoctorWorkingHours> workingHours = workingHoursRepository.findByDoctorIdAndIsActiveTrue(doctorId);
        List<DoctorScheduleOverride> overrides = overrideRepository.findByDoctorIdAndOverrideDateBetween(doctorId, from, to);

        ZoneId zone = ZoneId.systemDefault();
        int createdSlots = 0;

        for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
            final LocalDate currentDate = date;
            
            // Delete unbooked slots for this date before recreating
            ZonedDateTime startOfDay = currentDate.atStartOfDay(zone);
            ZonedDateTime endOfDay = startOfDay.plusDays(1).minusNanos(1);
            slotRepository.deleteByDoctorUserIdAndStartTimeBetweenAndIsBookedFalse(userId, startOfDay, endOfDay);
            
            Optional<DoctorScheduleOverride> overrideOpt = overrides.stream()
                    .filter(o -> o.getOverrideDate().equals(currentDate))
                    .findFirst();

            boolean isUnavailable = false;
            LocalTime startTime = null;
            LocalTime endTime = null;
            int slotDuration = 20;

            if (overrideOpt.isPresent()) {
                DoctorScheduleOverride override = overrideOpt.get();
                isUnavailable = override.getIsUnavailable();
                startTime = override.getStartTime();
                endTime = override.getEndTime();
            } else {
                int dayOfWeek = currentDate.getDayOfWeek().getValue() % 7; // Sunday=0
                Optional<DoctorWorkingHours> whOpt = workingHours.stream()
                        .filter(wh -> wh.getDayOfWeek() == dayOfWeek)
                        .findFirst();
                
                if (whOpt.isPresent()) {
                    DoctorWorkingHours wh = whOpt.get();
                    startTime = wh.getStartTime();
                    endTime = wh.getEndTime();
                    slotDuration = wh.getSlotDurationMinutes();
                } else {
                    isUnavailable = true;
                }
            }

            if (!isUnavailable && startTime != null && endTime != null) {
                // Generate slots
                List<AppointmentSlot> existingSlots = slotRepository.findByDoctorUserIdAndStartTimeBetween(userId, startOfDay, endOfDay);
                
                LocalTime currentSlotTime = startTime;
                while (currentSlotTime.plusMinutes(slotDuration).isBefore(endTime) || currentSlotTime.plusMinutes(slotDuration).equals(endTime)) {
                    ZonedDateTime slotStart = ZonedDateTime.of(currentDate, currentSlotTime, zone);
                    ZonedDateTime slotEnd = slotStart.plusMinutes(slotDuration);
                    
                    boolean exists = existingSlots.stream()
                            .anyMatch(s -> s.getStartTime().equals(slotStart));
                    
                    if (!exists) {
                        AppointmentSlot slot = AppointmentSlot.builder()
                                .doctor(doctor)
                                .startTime(slotStart)
                                .endTime(slotEnd)
                                .isBooked(false)
                                .branchId(doctor.getBranchId())
                                .build();
                        slotRepository.save(slot);
                        createdSlots++;
                    }
                    currentSlotTime = currentSlotTime.plusMinutes(slotDuration);
                }
            }
        }
        
        return createdSlots;
    }

    @Scheduled(cron = "0 0 1 * * *") // Run at 1 AM every day
    @EventListener(ApplicationReadyEvent.class)
    public void generateSlotsAutomatically() {
        log.info("Running scheduled slot generation");
        LocalDate today = LocalDate.now();
        LocalDate to = today.plusDays(14);
        
        try {
            List<DoctorProfile> activeDoctors = doctorRepository.findActiveDoctorsWithNames().stream()
                    .map(dto -> doctorRepository.findById(dto.getId()).orElse(null))
                    .filter(doc -> doc != null)
                    .collect(Collectors.toList());

            for (DoctorProfile doctor : activeDoctors) {
                try {
                    List<DoctorWorkingHours> workingHours = workingHoursRepository.findByDoctorIdAndIsActiveTrue(doctor.getId());
                    if (workingHours.isEmpty()) {
                        log.warn("Doctor {} (User ID: {}) has zero active working hours configured. No slots will be generated.", doctor.getId(), doctor.getUserId());
                    }
                    
                    int created = generateSlotsForRange(doctor.getUserId(), today, to);
                    if (created > 0) {
                        log.info("Generated {} slots for doctor {}", created, doctor.getId());
                    }
                } catch (Exception e) {
                    log.error("Failed to generate slots for doctor " + doctor.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to run automatic slot generation on startup", e);
        }
    }
}
