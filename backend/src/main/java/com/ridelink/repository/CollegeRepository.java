package com.ridelink.repository;

import com.ridelink.model.College;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollegeRepository extends JpaRepository<College, Long> {
    List<College> findByNameContainingIgnoreCaseOrCityContainingIgnoreCase(String name, String city);
    boolean existsByNameIgnoreCase(String name);
}
