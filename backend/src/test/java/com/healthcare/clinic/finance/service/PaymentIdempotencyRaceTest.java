package com.healthcare.clinic.finance.service;

import com.healthcare.clinic.finance.entity.Payment;
import com.healthcare.clinic.finance.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class PaymentIdempotencyRaceTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Test
    public void testConcurrentPaymentInitiationWithSameIdempotencyKey() throws InterruptedException {
        String idempotencyKey = "RACE-KEY-" + System.currentTimeMillis();
        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger duplicateCount = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    Payment p = paymentService.initiatePayment(new BigDecimal("150.00"), "CREDIT_CARD", idempotencyKey);
                    if (p != null) {
                        successCount.incrementAndGet();
                    }
                } catch (IllegalStateException e) {
                    duplicateCount.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        finishLatch.await();
        executor.shutdown();

        // Exactly one payment must exist in the database with this idempotency key
        var existing = paymentRepository.findByIdempotencyKey(idempotencyKey);
        assertThat(existing).isPresent();
        
        long count = paymentRepository.findAll().stream()
                .filter(p -> idempotencyKey.equals(p.getIdempotencyKey()))
                .count();
        assertThat(count).isEqualTo(1L);
    }
}
