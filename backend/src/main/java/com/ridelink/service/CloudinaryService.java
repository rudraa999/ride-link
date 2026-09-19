package com.ridelink.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "ridelink_profiles",
                    "resource_type", "image"
            ));
            return (String) uploadResult.get("secure_url");
        } catch (Exception e) {
            log.warn("Cloudinary upload failed (using data URI fallback): {}", e.getMessage());
            try {
                String base64 = Base64.getEncoder().encodeToString(file.getBytes());
                String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
                return "data:" + contentType + ";base64," + base64;
            } catch (IOException ioException) {
                log.error("Failed to encode file as base64 fallback", ioException);
                return null;
            }
        }
    }
}
