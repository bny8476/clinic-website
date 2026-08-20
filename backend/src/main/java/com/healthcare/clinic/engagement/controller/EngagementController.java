package com.healthcare.clinic.engagement.controller;

import com.healthcare.clinic.engagement.entity.*;
import com.healthcare.clinic.engagement.repository.*;
import com.healthcare.clinic.engagement.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/engagement")
@PreAuthorize("hasAuthority('ROLE_MARKETING') or hasAuthority('ROLE_ADMIN') or hasAuthority('ROLE_SUPER_ADMIN')")
@RequiredArgsConstructor
public class EngagementController {

    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;
    private final FeedbackRepository feedbackRepository;
    private final SurveyService surveyService;
    private final ReminderRepository reminderRepository;

    // --- Reviews ---

    @PostMapping("/reviews")
    public ResponseEntity<Review> submitReview(@RequestBody Review review) {
        return ResponseEntity.ok(reviewService.submitReview(review));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<Review>> getPublishedReviews(
            @RequestParam Review.TargetType targetType,
            @RequestParam(required = false) Long targetId) {
        
        List<Review> reviews;
        if (targetId != null) {
            reviews = reviewRepository.findByTargetTypeAndTargetIdAndStatus(targetType, targetId, Review.ReviewStatus.PUBLISHED);
        } else {
            reviews = reviewRepository.findByStatus(Review.ReviewStatus.PUBLISHED);
        }
        return ResponseEntity.ok(reviews);
    }

    @PutMapping("/reviews/{id}/moderate")
    public ResponseEntity<Review> moderateReview(
            @PathVariable Long id,
            @RequestParam Review.ReviewStatus status,
            @RequestParam Long moderatedByUserId) {
        return ResponseEntity.ok(reviewService.moderateReview(id, status, moderatedByUserId));
    }

    // --- Feedback ---

    @PostMapping("/feedback")
    public ResponseEntity<Feedback> submitFeedback(@RequestBody Feedback feedback) {
        return ResponseEntity.ok(feedbackRepository.save(feedback));
    }

    // --- Surveys ---

    @GetMapping("/surveys/pending")
    public ResponseEntity<List<SurveyTemplate>> getPendingSurveys() {
        // Just return general templates for demonstration
        return ResponseEntity.ok(surveyService.getTemplatesByContext(SurveyTemplate.TriggerContext.GENERAL));
    }

    @PostMapping("/surveys/{templateId}/responses")
    public ResponseEntity<SurveyResponse> submitSurveyResponse(
            @PathVariable Long templateId,
            @RequestBody SurveyResponse response) {
        response.setTemplateId(templateId);
        return ResponseEntity.ok(surveyService.submitResponse(response));
    }

    // --- Reminders ---

    @GetMapping("/reminders")
    public ResponseEntity<List<Reminder>> getPendingReminders(@RequestParam Long patientId, @RequestParam(required = false) String status) {
        if ("PENDING".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(reminderRepository.findByPatientIdAndStatus(patientId, Reminder.ReminderStatus.PENDING));
        }
        return ResponseEntity.ok(reminderRepository.findAll()); // Simplify for demo
    }

    @PutMapping("/reminders/{id}/dismiss")
    public ResponseEntity<Reminder> dismissReminder(@PathVariable Long id) {
        return reminderRepository.findById(id).map(r -> {
            r.setStatus(Reminder.ReminderStatus.DISMISSED);
            return ResponseEntity.ok(reminderRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/reminders/{id}/complete")
    public ResponseEntity<Reminder> completeReminder(@PathVariable Long id) {
        return reminderRepository.findById(id).map(r -> {
            r.setStatus(Reminder.ReminderStatus.COMPLETED);
            return ResponseEntity.ok(reminderRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }
}
