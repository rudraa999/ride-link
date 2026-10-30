package com.ridelink.repository;

import com.ridelink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:identifier) OR LOWER(u.email) = LOWER(CONCAT(:identifier, '@ridelink.com'))")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.college) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.activeCampus) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:role IS NULL OR :role = '' OR u.role = :role) " +
           "ORDER BY u.id DESC")
    List<User> searchUsers(@Param("search") String search, @Param("role") String role);
}
