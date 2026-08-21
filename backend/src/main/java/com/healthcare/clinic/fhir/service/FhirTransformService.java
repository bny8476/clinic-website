package com.healthcare.clinic.fhir.service;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.parser.IParser;
import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hl7.fhir.r4.model.Patient;
import org.hl7.fhir.r4.model.HumanName;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class FhirTransformService {

    private final UserRepository userRepository;
    private volatile FhirContext fhirContext;

    private FhirContext getFhirContext() {
        if (fhirContext == null) {
            synchronized (this) {
                if (fhirContext == null) {
                    fhirContext = FhirContext.forR4();
                }
            }
        }
        return fhirContext;
    }

    public String exportPatientAsFhirJson(Long patientId) {
        Optional<User> userOpt = userRepository.findById(patientId);
        if (userOpt.isEmpty()) {
            return "{\"error\": \"Patient not found\"}";
        }
        User user = userOpt.get();
        
        Patient fhirPatient = new Patient();
        fhirPatient.setId(user.getId().toString());
        
        HumanName name = new HumanName();
        name.setFamily(user.getLastName());
        name.addGiven(user.getFirstName());
        fhirPatient.addName(name);

        IParser parser = getFhirContext().newJsonParser().setPrettyPrint(true);
        return parser.encodeResourceToString(fhirPatient);
    }
}
