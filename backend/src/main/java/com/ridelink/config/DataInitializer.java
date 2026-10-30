package com.ridelink.config;

import com.ridelink.model.College;
import com.ridelink.model.User;
import com.ridelink.repository.CollegeRepository;
import com.ridelink.repository.UserRepository;
import com.ridelink.security.ChatEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CollegeRepository collegeRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedColleges();
        seedAdminUser();
        backfillPrivacySettings();
        backfillChatEncryption();
    }

    private void seedAdminUser() {
        Optional<User> existingAdmin = userRepository.findByIdentifier("admin");
        if (existingAdmin.isEmpty()) {
            User admin = User.builder()
                    .fullName("Platform Administrator")
                    .email("admin@ridelink.com")
                    .password(passwordEncoder.encode("admin123"))
                    .college("RideLink Central Administration")
                    .activeCampus("HQ Operations")
                    .phone("+1-800-RIDELINK")
                    .role("ROLE_ADMIN")
                    .showProfile(true)
                    .showPhonePostMatch(true)
                    .showPreciseDistance(true)
                    .showRideStats(true)
                    .build();
            userRepository.save(admin);
            log.info("Default Admin account seeded: username: 'admin' / email: 'admin@ridelink.com' / pass: 'admin123'");
        } else {
            User admin = existingAdmin.get();
            boolean updated = false;
            if (!"ROLE_ADMIN".equals(admin.getRole())) {
                admin.setRole("ROLE_ADMIN");
                updated = true;
            }
            if (updated) {
                userRepository.save(admin);
                log.info("Updated existing admin user account to ROLE_ADMIN");
            }
        }
    }

    private void backfillChatEncryption() {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT id, content FROM chat_messages");
            int encryptedCount = 0;
            for (Map<String, Object> row : rows) {
                Long id = ((Number) row.get("id")).longValue();
                String rawContent = (String) row.get("content");
                if (rawContent != null && !ChatEncryptionUtil.isEncrypted(rawContent)) {
                    String cipherText = ChatEncryptionUtil.encrypt(rawContent);
                    jdbcTemplate.update("UPDATE chat_messages SET content = ? WHERE id = ?", cipherText, id);
                    encryptedCount++;
                }
            }
            if (encryptedCount > 0) {
                log.info("Successfully encrypted {} legacy plain-text chat message(s) in database", encryptedCount);
            }
        } catch (Exception e) {
            log.warn("Chat messages encryption backfill skipped or failed: {}", e.getMessage());
        }
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
