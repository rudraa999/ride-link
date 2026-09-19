package com.ridelink.service;

import com.ridelink.model.College;
import com.ridelink.repository.CollegeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CollegeService {

    private final CollegeRepository collegeRepository;

    @Transactional(readOnly = true)
    public List<College> getAllColleges() {
        return collegeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<College> searchColleges(String query) {
        if (query == null || query.trim().isEmpty()) {
            return collegeRepository.findAll();
        }
        return collegeRepository.findByNameContainingIgnoreCaseOrCityContainingIgnoreCase(query.trim(), query.trim());
    }
}
