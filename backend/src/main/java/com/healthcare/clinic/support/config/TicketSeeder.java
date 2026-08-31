package com.healthcare.clinic.support.config;

import com.healthcare.clinic.identity.entity.User;
import com.healthcare.clinic.identity.repository.UserRepository;
import com.healthcare.clinic.support.entity.SupportTicket;
import com.healthcare.clinic.support.repository.SupportTicketRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TicketSeeder implements CommandLineRunner {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;

    public TicketSeeder(SupportTicketRepository supportTicketRepository, UserRepository userRepository) {
        this.supportTicketRepository = supportTicketRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (supportTicketRepository.count() == 0) {
            User patient = userRepository.findByEmail("patient@clinic.com").orElse(null);
            
            if (patient != null) {
                SupportTicket t1 = SupportTicket.builder()
                        .ticketNumber("TKT-1001")
                        .subject("Cannot view my latest lab results")
                        .category("TECHNICAL")
                        .priority("HIGH")
                        .status("OPEN")
                        .user(patient)
                        .build();

                SupportTicket t2 = SupportTicket.builder()
                        .ticketNumber("TKT-1002")
                        .subject("Billing discrepancy on recent visit")
                        .category("BILLING")
                        .priority("MEDIUM")
                        .status("IN_PROGRESS")
                        .user(patient)
                        .build();

                SupportTicket t3 = SupportTicket.builder()
                        .ticketNumber("TKT-1003")
                        .subject("Question about appointment cancellation policy")
                        .category("GENERAL")
                        .priority("LOW")
                        .status("RESOLVED")
                        .user(patient)
                        .build();

                supportTicketRepository.saveAll(List.of(t1, t2, t3));
                System.out.println("Seeded 3 support tickets.");
            }
        }
    }
}
