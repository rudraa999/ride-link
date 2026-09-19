package com.ridelink.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ride_matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private RideRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student1_id", nullable = false)
    private User student1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student2_id", nullable = false)
    private User student2;

    @Column(nullable = false)
    private String campusName;

    @Column(nullable = false)
    private String destinationName;

    @Column(nullable = false)
    private String departureTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum MatchStatus {
        ACTIVE,
        COMPLETED,
        CANCELLED
    }
}
