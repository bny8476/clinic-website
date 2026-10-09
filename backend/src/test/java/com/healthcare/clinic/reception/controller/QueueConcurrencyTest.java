package com.healthcare.clinic.reception.controller;

import com.healthcare.clinic.branch.entity.Branch;
import com.healthcare.clinic.branch.repository.BranchRepository;
import com.healthcare.clinic.reception.entity.QueueToken;
import com.healthcare.clinic.reception.service.QueueTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
public class QueueConcurrencyTest {

    @Autowired
    private QueueTokenService queueTokenService;

    @Autowired
    private BranchRepository branchRepository;

    @Test
    public void testConcurrentTokenGeneration() throws InterruptedException {
        // Setup
        Branch branch = branchRepository.findAll().stream().findFirst().orElseGet(() -> {
            Branch b = new Branch();
            b.setName("Concurrent Test Branch");
            b.setCity("Test City");
            b.setCountry("Test Country");
            b.setTimezone("UTC");
            b.setAddress("Test Address");
            b.setEmail("test@branch.com");
            b.setPhoneNumber("1234567890");
            b.setPostalCode("12345");
            b.setState("Test State");
            return branchRepository.save(b);
        });

        int numberOfThreads = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(1);
        List<Future<QueueToken>> futures = new ArrayList<>();

        for (int i = 0; i < numberOfThreads; i++) {
            Branch finalBranch = branch;
            futures.add(executorService.submit(() -> {
                latch.await(); // wait until all threads are ready
                return queueTokenService.generateToken(finalBranch, null, null);
            }));
        }

        latch.countDown(); // release all threads at once

        List<QueueToken> tokens = new ArrayList<>();
        for (Future<QueueToken> future : futures) {
            try {
                tokens.add(future.get());
            } catch (ExecutionException e) {
                // If it fails, we will catch it here, but it shouldn't if retries work
                e.printStackTrace();
            }
        }

        assertEquals(numberOfThreads, tokens.size(), "Should have generated tokens for all threads");

        Set<Integer> uniqueTokenNumbers = tokens.stream().map(QueueToken::getTokenNumber).collect(Collectors.toSet());
        assertEquals(numberOfThreads, uniqueTokenNumbers.size(), "Token numbers should be unique");
    }
}
