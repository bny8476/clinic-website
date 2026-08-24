package com.healthcare.clinic.subscription.service;

import com.healthcare.clinic.subscription.entity.FeaturePlan;
import com.healthcare.clinic.subscription.repository.FeaturePlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FeaturePlanService {

    private final FeaturePlanRepository repository;

    @org.springframework.cache.annotation.Cacheable("featurePlans")
    public List<FeaturePlan> findAll() {
        return repository.findAll();
    }

    public Optional<FeaturePlan> findById(Long id) {
        return repository.findById(id);
    }

    @org.springframework.cache.annotation.CacheEvict(value = "featurePlans", allEntries = true)
    public FeaturePlan save(FeaturePlan entity) {
        return repository.save(entity);
    }

    @org.springframework.cache.annotation.CacheEvict(value = "featurePlans", allEntries = true)
    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
