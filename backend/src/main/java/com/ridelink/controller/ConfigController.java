package com.ridelink.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${geoapify.api-key:}")
    private String geoapifyApiKey;

    @GetMapping("/geoapify")
    public ResponseEntity<Map<String, String>> getGeoapifyConfig() {
        return ResponseEntity.ok(Map.of("apiKey", geoapifyApiKey != null ? geoapifyApiKey : ""));
    }
}
