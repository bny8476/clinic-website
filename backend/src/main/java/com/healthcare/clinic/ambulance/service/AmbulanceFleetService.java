package com.healthcare.clinic.ambulance.service;

import com.healthcare.clinic.ambulance.entity.Ambulance;
import com.healthcare.clinic.ambulance.entity.HospitalDestination;
import com.healthcare.clinic.ambulance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AmbulanceFleetService {
    private final AmbulanceRepository ambulanceRepository;
    private final HospitalDestinationRepository hospitalRepository;

    public List<Ambulance> getAllAmbulances() {
        return ambulanceRepository.findAll();
    }
    
    public List<HospitalDestination> getAllHospitals() {
        return hospitalRepository.findAll();
    }
}
