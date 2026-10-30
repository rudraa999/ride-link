package com.ridelink.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Component
public class ChatEncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;
    public static final String PREFIX = "ENC::";

    private static SecretKeySpec secretKey;

    @Value("${app.chat.encryption-key:${app.jwt.secret:9a6747f3c18c6bc3634125b2511f70caeb5ce3d5e7b3fe694710024790fb49b1}}")
    public void setSecretKey(String key) {
        initKey(key);
    }

    private static synchronized void initKey(String key) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha.digest(key.getBytes(StandardCharsets.UTF_8));
            secretKey = new SecretKeySpec(keyBytes, "AES");
            log.info("Chat encryption key initialized successfully (AES-256 GCM)");
        } catch (Exception e) {
            log.error("Failed to initialize AES key for chat encryption: {}", e.getMessage());
            throw new IllegalStateException("Failed to initialize AES key", e);
        }
    }

    private static SecretKeySpec getKey() {
        if (secretKey == null) {
            initKey("9a6747f3c18c6bc3634125b2511f70caeb5ce3d5e7b3fe694710024790fb49b1");
        }
        return secretKey;
    }

    public static String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return plainText;
        }
        if (plainText.startsWith(PREFIX)) {
            return plainText; // already encrypted
        }
        try {
            byte[] iv = new byte[IV_LENGTH_BYTE];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, getKey(), new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return PREFIX + Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            log.error("Failed to encrypt chat message: {}", e.getMessage());
            throw new RuntimeException("Chat message encryption failed", e);
        }
    }

    public static String decrypt(String cipherTextWithPrefix) {
        if (cipherTextWithPrefix == null || cipherTextWithPrefix.isEmpty()) {
            return cipherTextWithPrefix;
        }
        if (!cipherTextWithPrefix.startsWith(PREFIX)) {
            return cipherTextWithPrefix; // legacy unencrypted
        }
        try {
            String rawBase64 = cipherTextWithPrefix.substring(PREFIX.length());
            byte[] decoded = Base64.getDecoder().decode(rawBase64);

            if (decoded.length < IV_LENGTH_BYTE) {
                return cipherTextWithPrefix;
            }

            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[IV_LENGTH_BYTE];
            byteBuffer.get(iv);
            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, getKey(), new GCMParameterSpec(TAG_LENGTH_BIT, iv));
            byte[] plainText = cipher.doFinal(cipherText);

            return new String(plainText, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Decryption failed for message, returning raw text: {}", e.getMessage());
            return cipherTextWithPrefix;
        }
    }

    public static boolean isEncrypted(String text) {
        return text != null && text.startsWith(PREFIX);
    }
}
