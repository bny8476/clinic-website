package com.healthcare.clinic.fhir.service;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class FhirTransformService {

    private final UserRepository userRepository;

    public String exportPatientAsFhirJson(Long patientId) {
        Optional<User> userOpt = userRepository.findById(patientId);
        if (userOpt.isEmpty()) {
            return "{\"error\": \"Patient not found\"}";
        }
        User user = userOpt.get();
        return String.format(
            "{\"resourceType\": \"Patient\", \"id\": \"%s\", \"name\": [{\"family\": \"%s\", \"given\": [\"%s\"]}]}",
            user.getId(),
            user.getLastName() != null ? user.getLastName() : "",
            user.getFirstName() != null ? user.getFirstName() : ""
        );
    }
}
