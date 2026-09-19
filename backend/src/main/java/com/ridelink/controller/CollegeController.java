package com.ridelink.controller;

import com.ridelink.model.College;
import com.ridelink.service.CollegeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/colleges")
@RequiredArgsConstructor
public class CollegeController {

    private final CollegeService collegeService;

    @GetMapping
    public ResponseEntity<List<College>> getAllColleges(@RequestParam(value = "search", required = false) String search) {
        if (search != null && !search.trim().isEmpty()) {
            return ResponseEntity.ok(collegeService.searchColleges(search));
        }
        return ResponseEntity.ok(collegeService.getAllColleges());
    }
}
