package com.ridelink.config;

import com.ridelink.model.College;
import com.ridelink.repository.CollegeRepository;
import com.ridelink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CollegeRepository collegeRepository;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        seedColleges();
        backfillPrivacySettings();
    }

    private void backfillPrivacySettings() {
        userRepository.findAll().forEach(u -> {
            boolean updated = false;
            if (u.getShowProfile() == null) { u.setShowProfile(true); updated = true; }
            if (u.getShowPhonePostMatch() == null) { u.setShowPhonePostMatch(true); updated = true; }
            if (u.getShowPreciseDistance() == null) { u.setShowPreciseDistance(true); updated = true; }
            if (u.getShowRideStats() == null) { u.setShowRideStats(true); updated = true; }
            if (updated) {
                userRepository.save(u);
            }
        });
    }

    private void seedColleges() {
        List<College> colleges = List.of(
                College.builder().name("Dr. Vishwanath Karad MIT World Peace University").city("Pune").build(),
                College.builder().name("MIT-WPU").city("Pune").build(),
                College.builder().name("COEP Technological University").city("Pune").build(),
                College.builder().name("Pune Institute of Computer Technology").city("Pune").build(),
                College.builder().name("Vishwakarma Institute of Technology").city("Pune").build(),
                College.builder().name("Symbiosis International University").city("Pune").build(),
                College.builder().name("Bharati Vidyapeeth Deemed University").city("Pune").build(),
                College.builder().name("Cummins College of Engineering for Women").city("Pune").build(),
                College.builder().name("Army Institute of Technology").city("Pune").build(),
                College.builder().name("Sinhgad College of Engineering").city("Pune").build(),
                College.builder().name("D.Y. Patil College of Engineering").city("Pune").build(),
                College.builder().name("Pimpri Chinchwad College of Engineering").city("Pune").build(),
                College.builder().name("Modern College of Engineering").city("Pune").build(),
                College.builder().name("MIT Academy of Engineering").city("Pune").build(),
                College.builder().name("International Institute of Information Technology").city("Pune").build()
        );

        for (College college : colleges) {
            if (!collegeRepository.existsByNameIgnoreCase(college.getName())) {
                collegeRepository.save(college);
                log.info("Auto-seeded college: {}", college.getName());
            }
        }
    }
}
