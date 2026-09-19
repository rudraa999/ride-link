package com.ridelink.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String college;

    @Column(nullable = false)
    private String activeCampus;

    private String phone;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String profileImageUrl;

    @Builder.Default
    @Column(nullable = false)
    private Boolean showProfile = true;

    @Builder.Default
    @Column(nullable = false)
    private Boolean showPhonePostMatch = true;

    @Builder.Default
    @Column(nullable = false)
    private Boolean showPreciseDistance = true;

    @Builder.Default
    @Column(nullable = false)
    private Boolean showRideStats = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
