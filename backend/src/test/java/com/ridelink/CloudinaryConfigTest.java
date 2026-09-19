package com.ridelink;

import com.cloudinary.Cloudinary;
import com.ridelink.config.CloudinaryConfig;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class CloudinaryConfigTest {

    @Test
    void testCloudinaryBeanCreationFromUrl() {
        CloudinaryConfig config = new CloudinaryConfig();
        ReflectionTestUtils.setField(config, "cloudinaryUrl", "cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz@my_test_cloud");

        Cloudinary cloudinary = config.cloudinary();
        assertNotNull(cloudinary);
        assertEquals("my_test_cloud", cloudinary.config.cloudName);
        assertEquals("123456789012345", cloudinary.config.apiKey);
        assertEquals("abcdefghijklmnopqrstuvwxyz", cloudinary.config.apiSecret);
    }

    @Test
    void testCloudinaryBeanCreationFromIndividualProps() {
        CloudinaryConfig config = new CloudinaryConfig();
        ReflectionTestUtils.setField(config, "cloudinaryUrl", "");
        ReflectionTestUtils.setField(config, "cloudName", "custom_cloud");
        ReflectionTestUtils.setField(config, "apiKey", "key999");
        ReflectionTestUtils.setField(config, "apiSecret", "secret888");

        Cloudinary cloudinary = config.cloudinary();
        assertNotNull(cloudinary);
        assertEquals("custom_cloud", cloudinary.config.cloudName);
        assertEquals("key999", cloudinary.config.apiKey);
        assertEquals("secret888", cloudinary.config.apiSecret);
    }
}
